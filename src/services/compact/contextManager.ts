import type { Message } from '../../types/message.js';
import { type TokenCounter, EstimatedTokenCounter } from './tokenCounter.js';

export interface CompressionResult {
  messages: Message[];
  compressed: boolean;
  removedCount: number;
  strategy: string;
}

export interface ContextManagerConfig {
  maxTokens: number;
  compactThreshold: number;
  maxToolOutputLength: number;
  preserveRecent: number;
  summarize: (text: string) => Promise<string>;
}

const DEFAULT_CONFIG: ContextManagerConfig = {
  maxTokens: 8000,
  compactThreshold: 0.8,
  maxToolOutputLength: 5000,
  preserveRecent: 5,
  summarize: async (text) => `[Summary of ${text.length} chars]`,
};

export class ContextManager {
  private config: ContextManagerConfig;
  private tokenCounter: TokenCounter;

  constructor(config: Partial<ContextManagerConfig> = {}, tokenCounter?: TokenCounter) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenCounter = tokenCounter ?? new EstimatedTokenCounter();
  }

  get maxTokens(): number {
    return this.config.maxTokens;
  }

  countTokens(messages: Message[]): number {
    return this.tokenCounter.countMessages(messages);
  }

  updateMaxTokens(maxTokens: number): void {
    this.config.maxTokens = maxTokens;
  }

  setSummarize(summarize: (text: string) => Promise<string>): void {
    this.config.summarize = summarize;
  }

  microcompact(messages: Message[]): CompressionResult {
    let changed = false;
    const result: Message[] = [];

    for (const msg of messages) {
      if (typeof msg.content === 'string' && msg.content.trim().length === 0 && !msg.toolCalls) {
        changed = true;
        continue;
      }
      if (msg.role === 'tool' && typeof msg.content === 'string' && msg.content.length > this.config.maxToolOutputLength) {
        changed = true;
        const half = Math.floor(this.config.maxToolOutputLength / 2);
        result.push({
          ...msg,
          content: msg.content.slice(0, half) + '\n\n[...truncated...]\n\n' + msg.content.slice(-half),
        });
        continue;
      }
      result.push(msg);
    }

    return { messages: result, compressed: changed, removedCount: messages.length - result.length, strategy: 'microcompact' };
  }

  async autocompact(messages: Message[]): Promise<CompressionResult> {
    const tokens = this.tokenCounter.countMessages(messages);
    if (tokens <= this.config.maxTokens * this.config.compactThreshold) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');
    const compressCount = Math.floor(nonSystem.length / 2);

    if (compressCount < 3) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    const toCompress = nonSystem.slice(0, compressCount);
    const toKeep = nonSystem.slice(compressCount);

    const conversationText = toCompress
      .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
      .join('\n');

    const summary = await this.config.summarize(conversationText);

    const summaryMessage: Message = {
      role: 'system',
      content: `[Context compressed — ${compressCount} messages summarized]\n\n${summary}`,
    };

    const result = [...systemMessages, summaryMessage, ...toKeep];

    return { messages: result, compressed: true, removedCount: compressCount, strategy: 'autocompact' };
  }

  collapseToolSequences(messages: Message[]): CompressionResult {
    const result: Message[] = [];
    let toolSequence: Message[] = [];
    let collapsed = 0;

    const flushSequence = () => {
      if (toolSequence.length >= 4) {
        const toolNames = toolSequence
          .filter(m => m.toolCalls)
          .flatMap(m => m.toolCalls!.map(tc => tc.function.name));
        const uniqueTools = [...new Set(toolNames)];
        result.push({ role: 'system', content: `[Executed ${toolSequence.length} tool calls: ${uniqueTools.join(', ')}]` });
        collapsed += toolSequence.length - 1;
      } else {
        result.push(...toolSequence);
      }
      toolSequence = [];
    };

    for (const msg of messages) {
      if (msg.role === 'tool' || (msg.role === 'assistant' && msg.toolCalls)) {
        toolSequence.push(msg);
      } else {
        flushSequence();
        result.push(msg);
      }
    }
    flushSequence();

    return { messages: result, compressed: collapsed > 0, removedCount: collapsed, strategy: 'context_collapse' };
  }

  reactiveCompress(messages: Message[]): CompressionResult {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    if (nonSystem.length <= this.config.preserveRecent) {
      return { messages, compressed: false, removedCount: 0, strategy: 'reactive' };
    }

    const recent = nonSystem.slice(-this.config.preserveRecent);
    const removed = nonSystem.length - this.config.preserveRecent;

    const result: Message[] = [
      ...systemMessages,
      { role: 'system', content: `[Context compressed: ${removed} earlier messages removed due to length limits]` },
      ...recent,
    ];

    return { messages: result, compressed: true, removedCount: removed, strategy: 'reactive' };
  }

  async compress(messages: Message[]): Promise<Message[]> {
    let result = this.microcompact(messages);

    const autocompactResult = await this.autocompact(result.messages);
    if (autocompactResult.compressed) {
      result = autocompactResult;
    }

    const tokens = this.tokenCounter.countMessages(result.messages);
    if (tokens > this.config.maxTokens) {
      const collapseResult = this.collapseToolSequences(result.messages);
      if (collapseResult.compressed) {
        result = collapseResult;
      }
    }

    return result.messages;
  }
}
