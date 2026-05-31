import type { StreamChunk } from '../../types/api.js';
import type { ToolCall } from '../../types/message.js';

export function parseSSEStream(response: Response): AsyncGenerator<StreamChunk> {
  return streamGenerator(response);
}

async function* streamGenerator(response: Response): AsyncGenerator<StreamChunk> {
  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const currentToolCalls: Map<number, ToolCall> = new Map();
  let lastUsage: { inputTokens: number; outputTokens: number } | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          // Yield any remaining tool calls
          for (const tc of currentToolCalls.values()) {
            yield { type: 'tool_use', toolCall: tc };
          }
          currentToolCalls.clear();
          yield { type: 'done', usage: lastUsage };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            yield { type: 'text', content: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0;
              if (!currentToolCalls.has(index)) {
                currentToolCalls.set(index, {
                  id: tc.id ?? '',
                  type: 'function',
                  function: { name: '', arguments: '' },
                });
              }
              const existing = currentToolCalls.get(index)!;
              if (tc.id) existing.id = tc.id;
              if (tc.function?.name) existing.function.name = tc.function.name;
              if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
            }
          }

          // Capture usage from any chunk (some APIs send it with finish_reason, others separately)
          if (parsed.usage) {
            lastUsage = {
              inputTokens: parsed.usage.prompt_tokens ?? 0,
              outputTokens: parsed.usage.completion_tokens ?? 0,
            };
          }

          if (parsed.choices?.[0]?.finish_reason) {
            for (const tc of currentToolCalls.values()) {
              yield { type: 'tool_use', toolCall: tc };
            }
            currentToolCalls.clear();
            yield {
              type: 'done',
              finishReason: parsed.choices[0].finish_reason,
              usage: lastUsage,
            };
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
