import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';
import type { ToolCall } from '../../types/message.js';
import { runToolUse } from './toolExecution.js';

export async function runTools(
  toolCalls: ToolCall[],
  getTool: (name: string) => Tool | undefined,
  context: ToolUseContext,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  const concurrentBatch: { tool: Tool; call: ToolCall; args: unknown }[] = [];

  for (const call of toolCalls) {
    const tool = getTool(call.function.name);
    if (!tool) {
      results.push({
        toolUseId: call.id,
        name: call.function.name,
        result: '',
        error: `Unknown tool: ${call.function.name}`,
        isError: true,
      });
      continue;
    }

    let args: unknown;
    try {
      args = JSON.parse(call.function.arguments);
    } catch {
      results.push({
        toolUseId: call.id,
        name: call.function.name,
        result: '',
        error: `Invalid JSON arguments`,
        isError: true,
      });
      continue;
    }

    if (tool.isConcurrencySafe()) {
      concurrentBatch.push({ tool, call, args });
    } else {
      if (concurrentBatch.length > 0) {
        const batchResults = await Promise.all(
          concurrentBatch.map(({ tool: t, call: c, args: a }) =>
            runToolUse(t, a, context).then(r => ({ ...r, toolUseId: c.id })),
          ),
        );
        results.push(...batchResults);
        concurrentBatch.length = 0;
      }
      const result = await runToolUse(tool, args, context);
      results.push({ ...result, toolUseId: call.id });
    }
  }

  if (concurrentBatch.length > 0) {
    const batchResults = await Promise.all(
      concurrentBatch.map(({ tool: t, call: c, args: a }) =>
        runToolUse(t, a, context).then(r => ({ ...r, toolUseId: c.id })),
      ),
    );
    results.push(...batchResults);
  }

  return results;
}
