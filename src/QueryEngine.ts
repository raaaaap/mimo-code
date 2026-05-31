import type { Message, TokenUsage } from './types/message.js';
import type { ModelRequest } from './types/api.js';
import { queryLoop, type QueryDeps } from './query.js';

export interface QueryEngineConfig extends QueryDeps {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: ModelRequest['tools'];
}

export class QueryEngine {
  private mutableMessages: Message[] = [];
  private totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
  private config: QueryEngineConfig;
  private abortController: AbortController | null = null;

  constructor(config: QueryEngineConfig) {
    this.config = config;
  }

  async *submitMessage(content: string): AsyncGenerator<Message> {
    this.abortController = new AbortController();
    const userMessage: Message = { role: 'user', content };
    this.mutableMessages.push(userMessage);

    try {
      for await (const msg of queryLoop(
        this.mutableMessages,
        this.config,
        {
          model: this.config.model,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
          abortSignal: this.abortController.signal,
        },
        this.config.systemPrompt,
        this.config.tools,
      )) {
        this.mutableMessages.push(msg);

        // Accumulate usage from API response
        if (msg.usage && (msg.usage.inputTokens > 0 || msg.usage.outputTokens > 0)) {
          this.totalUsage.inputTokens += msg.usage.inputTokens;
          this.totalUsage.outputTokens += msg.usage.outputTokens;
        } else if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.length > 0) {
          // Fallback: estimate tokens when API doesn't return usage
          // ~4 chars per token for English, ~2 chars per token for CJK
          const outputChars = msg.content.length;
          const estimatedOutput = Math.ceil(outputChars / 3);
          // Estimate input from system prompt + all messages
          const inputChars = (this.config.systemPrompt?.length ?? 0) +
            this.mutableMessages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
          const estimatedInput = Math.ceil(inputChars / 3);
          this.totalUsage.inputTokens += estimatedInput;
          this.totalUsage.outputTokens += estimatedOutput;
        }

        yield msg;
      }
    } finally {
      this.abortController = null;
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  getMessages(): Message[] {
    return [...this.mutableMessages];
  }

  getUsage(): TokenUsage {
    return { ...this.totalUsage };
  }
}
