import { OpenAIAdapter } from './openai.js';
import type { ModelRequest, StreamChunk } from '../../../types/api.js';
import type { Message } from '../../../types/message.js';
import { ContextManager } from '../../compact/contextManager.js';

interface MimoModelConfig {
  contextWindow: number;
  maxOutput: number;
}

const MIMO_MODELS: Record<string, MimoModelConfig> = {
  'mimo-v2.5-pro':  { contextWindow: 1000000, maxOutput: 16384 },
  'mimo-v2.5':      { contextWindow: 1000000, maxOutput: 8192 },
};

export class MimoAdapter extends OpenAIAdapter {
  readonly name = 'mimo';
  private contextManager: ContextManager;

  constructor(endpoint: string, apiKey: string) {
    super(endpoint, apiKey);
    this.contextManager = new ContextManager();
  }

  supports(model: string): boolean {
    return model.startsWith('mimo-');
  }

  getContextWindow(model: string): number {
    return MIMO_MODELS[model]?.contextWindow ?? 256000;
  }

  countTokens(messages: Message[]): number {
    return this.contextManager.countTokens(messages);
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const contextWindow = this.getContextWindow(request.model);
    this.contextManager.updateMaxTokens(contextWindow);

    this.contextManager.setSummarize(async (text) => {
      const response = await this.chat({
        model: request.model,
        messages: [{ role: 'user', content: text }],
        system: '请将以下对话压缩为简要摘要，保留关键信息、文件路径和决策结论。输出不超过 200 字。',
        maxTokens: 300,
      });
      return response.content;
    });

    const compressed = await this.contextManager.compress(request.messages);

    yield* super.streamChat({
      ...request,
      messages: compressed,
    });
  }
}
