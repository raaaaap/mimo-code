import type { Message, ToolCall } from './types/message.js';
import type { ModelRequest, StreamChunk } from './types/api.js';
import type { QueryOptions, Tool, ToolUseContext } from './types/tool.js';
import { runToolUse } from './services/tools/toolExecution.js';

export interface QueryDeps {
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  microcompact: (messages: Message[]) => Message[];
  autocompact: (messages: Message[]) => Promise<Message[]>;
  uuid: () => string;
  getTool: (name: string) => Tool | undefined;
  toolContext: ToolUseContext;
}

/** Parse tool calls from text content when the API doesn't support structured tool_calls */
function parseToolCallsFromText(text: string, uuid: () => string): ToolCall[] {
  const results: ToolCall[] = [];

  // Match JSON format: {"name": "ToolName", "arguments": {...}}
  const jsonMatch = text.match(/\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[\s\S]*?\})\s*\}/);
  if (jsonMatch) {
    try {
      results.push({ id: uuid(), type: 'function', function: { name: jsonMatch[1], arguments: jsonMatch[2] } });
      return results;
    } catch { /* skip */ }
  }

  // Match alternate JSON format: {"tool": "ToolName", "input": {...}}
  const altMatch = text.match(/\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"input"\s*:\s*(\{[\s\S]*?\})\s*\}/);
  if (altMatch) {
    try {
      results.push({ id: uuid(), type: 'function', function: { name: altMatch[1], arguments: altMatch[2] } });
      return results;
    } catch { /* skip */ }
  }

  return results;
}

export async function* queryLoop(
  messages: Message[],
  deps: QueryDeps,
  options: Pick<QueryOptions, 'model' | 'maxTokens' | 'temperature'> & { abortSignal?: AbortSignal },
  systemPrompt?: string,
  tools?: ModelRequest['tools'],
): AsyncGenerator<Message> {
  const MAX_TURNS = 20;
  let turn = 0;

  while (turn < MAX_TURNS) {
    if (options.abortSignal?.aborted) {
      yield { role: 'assistant', content: '[Aborted by user]' };
      return;
    }
    turn++;

    const request: ModelRequest = {
      model: options.model,
      messages,
      system: systemPrompt,
      tools,
      maxTokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
      abortSignal: options.abortSignal,
    };

    const contentParts: string[] = [];
    const toolCalls: ToolCall[] = [];
    let finishReason: string | undefined;

    for await (const chunk of deps.callModel(request)) {
      if (chunk.type === 'text' && chunk.content) contentParts.push(chunk.content);
      if (chunk.type === 'tool_use' && chunk.toolCall) toolCalls.push(chunk.toolCall);
      if (chunk.type === 'done') {
        finishReason = chunk.finishReason;
        break;
      }
      if (chunk.type === 'error') {
        yield { role: 'assistant', content: `Error: ${chunk.content}` };
        return;
      }
    }

    const fullContent = contentParts.join('');

    // If no structured tool calls from API, try to parse from text content
    if (toolCalls.length === 0 && fullContent) {
      const parsed = parseToolCallsFromText(fullContent, deps.uuid);
      if (parsed.length > 0) {
        toolCalls.push(...parsed);
      }
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: fullContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
    messages = [...messages, assistantMessage];
    yield assistantMessage;

    if (toolCalls.length === 0) return;

    // Execute tools and add real results
    for (const tc of toolCalls) {
      const tool = deps.getTool(tc.function.name);
      if (!tool) {
        messages = [...messages, { role: 'tool', content: `Error: Unknown tool "${tc.function.name}"`, toolCallId: tc.id }];
        continue;
      }

      let args: unknown;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        messages = [...messages, { role: 'tool', content: `Error: Invalid JSON arguments for tool "${tc.function.name}"`, toolCallId: tc.id }];
        continue;
      }

      const contextWithMessages: ToolUseContext = { ...deps.toolContext, messages };
      const result = await runToolUse(tool, args, contextWithMessages);
      messages = [...messages, { role: 'tool', content: result.error && result.isError ? result.error : result.result, toolCallId: tc.id }];
    }
  }
}
