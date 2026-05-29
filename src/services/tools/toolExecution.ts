import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';

export async function runToolUse(
  tool: Tool,
  rawArgs: unknown,
  context: ToolUseContext,
): Promise<ToolResult> {
  const parsed = tool.inputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: `Invalid input: ${parsed.error.errors.map(e => e.message).join(', ')}`,
      isError: true,
    };
  }

  const permission = tool.checkPermissions(parsed.data, context);
  if (!permission.allowed) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: `Permission denied: ${permission.reason ?? 'not allowed'}`,
      isError: true,
    };
  }

  try {
    return await tool.call(parsed.data, context);
  } catch (error) {
    return {
      toolUseId: '',
      name: tool.name,
      result: '',
      error: error instanceof Error ? error.message : String(error),
      isError: true,
    };
  }
}
