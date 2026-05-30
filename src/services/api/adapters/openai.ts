import type { ModelAdapter, ModelRequest, ModelResponse, StreamChunk } from '../../../types/api.js';
import type { Message, TokenUsage } from '../../../types/message.js';
import { parseSSEStream } from '../streaming.js';
import { withRetry } from '../retry.js';
import { DEFAULT_RETRY_CONFIG } from '../../../types/api.js';

export class OpenAIAdapter implements ModelAdapter {
  readonly name: string = 'openai';
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  supports(model: string): boolean {
    return !model.startsWith('claude-');
  }

  countTokens(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        total += Math.ceil(msg.content.length / 4);
      } else {
        for (const part of msg.content) {
          if (part.text) total += Math.ceil(part.text.length / 4);
        }
      }
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          total += Math.ceil(tc.function.arguments.length / 4);
        }
      }
    }
    return total;
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(request, true);
    const response = await this.fetchWithRetry(body, request.abortSignal);
    if (!response.ok) {
      const error = await response.text();
      yield { type: 'error', content: `API error ${response.status}: ${error}` };
      return;
    }
    yield* parseSSEStream(response);
  }

  async chat(request: ModelRequest): Promise<ModelResponse> {
    const body = this.buildRequestBody(request, false);
    const response = await this.fetchWithRetry(body, request.abortSignal);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error ${response.status}: ${error}`);
    }
    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error('No choices in response');
    const usage: TokenUsage | undefined = data.usage ? {
      inputTokens: data.usage.prompt_tokens ?? 0,
      outputTokens: data.usage.completion_tokens ?? 0,
    } : undefined;
    return {
      content: choice.message?.content ?? '',
      toolCalls: choice.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
      usage,
      finishReason: choice.finish_reason,
    };
  }

  private buildRequestBody(request: ModelRequest, stream: boolean) {
    const messages: unknown[] = [];
    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }
    for (const msg of request.messages) {
      if (msg.role === 'tool') {
        messages.push({
          role: 'tool',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          tool_call_id: msg.toolCallId,
        });
      } else if (msg.role === 'assistant' && msg.toolCalls) {
        messages.push({
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          tool_calls: msg.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: tc.function })),
        });
      } else {
        messages.push({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        });
      }
    }
    return {
      model: request.model,
      messages,
      tools: request.tools,
      tool_choice: request.toolChoice,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      stream,
    };
  }

  private async fetchWithRetry(body: unknown, abortSignal?: AbortSignal): Promise<Response> {
    return withRetry(async () => {
      const signals: AbortSignal[] = [AbortSignal.timeout(300_000)];
      if (abortSignal) signals.push(abortSignal);
      return fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.any(signals),
      });
    }, DEFAULT_RETRY_CONFIG);
  }
}
