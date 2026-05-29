import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../types/api.js';
import type { Message } from '../../types/message.js';
import { MimoAdapter } from './adapters/mimo.js';
import { OpenAIAdapter } from './adapters/openai.js';

export class APIClient {
  private adapters: ModelAdapter[] = [];
  private defaultAdapter: ModelAdapter;

  constructor(endpoint: string, apiKey: string) {
    this.defaultAdapter = new OpenAIAdapter(endpoint, apiKey);
    this.adapters.push(new MimoAdapter(endpoint, apiKey));
    this.adapters.push(this.defaultAdapter);
  }

  addAdapter(adapter: ModelAdapter): void {
    this.adapters.push(adapter);
  }

  private getAdapter(model: string): ModelAdapter {
    for (const adapter of this.adapters) {
      if (adapter.supports(model)) return adapter;
    }
    return this.defaultAdapter;
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const adapter = this.getAdapter(request.model);
    yield* adapter.streamChat(request);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const adapter = this.getAdapter(request.model);
    return adapter.chat(request);
  }

  countTokens(messages: Message[]): number {
    return this.defaultAdapter.countTokens(messages);
  }
}
