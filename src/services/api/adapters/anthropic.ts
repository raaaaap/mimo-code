import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../../types/api.js';
import type { Message } from '../../../types/message.js';

export class AnthropicAdapter implements ModelAdapter {
  readonly name = 'anthropic';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl ?? 'https://api.anthropic.com';
  }

  supports(model: string): boolean {
    return model.startsWith('claude-') || model.startsWith('anthropic-');
  }

  countTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0) / 4, 0);
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const anthropicMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }));

    const body = {
      model: request.model,
      messages: anthropicMessages,
      system: request.system,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: request.abortSignal,
      });

      if (!response.ok) {
        yield { type: 'error', content: `Anthropic API error: ${response.status}` };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', content: 'No response body' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { type: 'text', content: parsed.delta.text };
            }
            if (parsed.type === 'message_stop') {
              yield { type: 'done' };
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      reader.releaseLock();
    } catch (error) {
      yield { type: 'error', content: error instanceof Error ? error.message : String(error) };
    }
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const chunks: StreamChunk[] = [];
    for await (const chunk of this.streamChat(request)) {
      chunks.push(chunk);
    }
    return {
      content: chunks.filter(c => c.type === 'text').map(c => c.content).join(''),
      finishReason: 'stop',
    };
  }
}
