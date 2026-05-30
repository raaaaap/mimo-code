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

    const assistantMessage: Message = {
      role: 'assistant',
      content: contentParts.join(''),
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
