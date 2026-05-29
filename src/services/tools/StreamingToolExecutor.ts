import type { Tool, ToolUseContext, ToolResult } from '../../types/tool.js';
import type { ToolCall } from '../../types/message.js';
import { runToolUse } from './toolExecution.js';

export class StreamingToolExecutor {
  private resultCallback: ((result: ToolResult) => void) | null = null;
  private getTool: (name: string) => Tool | undefined;
  private context: ToolUseContext;
  private pendingResults: Map<string, { promise: Promise<ToolResult>; resolve: (result: ToolResult) => void }> = new Map();

  constructor(
    getTool: (name: string) => Tool | undefined,
    context: ToolUseContext,
  ) {
    this.getTool = getTool;
    this.context = context;
  }

  onResult(callback: (result: ToolResult) => void): void {
    this.resultCallback = callback;
  }

  addToolCall(toolCall: ToolCall): Promise<ToolResult> {
    let resolveFn: (result: ToolResult) => void;
    const promise = new Promise<ToolResult>((resolve) => {
      resolveFn = resolve;
    });

    // Store pending result tracking
    this.pendingResults.set(toolCall.id, { promise, resolve: resolveFn! });

    const tool = this.getTool(toolCall.function.name);
    if (!tool) {
      const result: ToolResult = {
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: `Unknown tool: ${toolCall.function.name}`,
        isError: true,
      };
      this.finishResult(toolCall.id, result);
      return promise;
    }

    let args: unknown;
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      const result: ToolResult = {
        toolUseId: toolCall.id,
        name: toolCall.function.name,
        result: '',
        error: 'Invalid JSON arguments',
        isError: true,
      };
      this.finishResult(toolCall.id, result);
      return promise;
    }

    runToolUse(tool, args, this.context)
      .then((result) => {
        this.finishResult(toolCall.id, { ...result, toolUseId: toolCall.id });
      })
      .catch((error) => {
        this.finishResult(toolCall.id, {
          toolUseId: toolCall.id,
          name: toolCall.function.name,
          result: '',
          error: error instanceof Error ? error.message : String(error),
          isError: true,
        });
      });

    return promise;
  }

  async waitForAll(): Promise<ToolResult[]> {
    const promises = Array.from(this.pendingResults.values()).map((entry) => entry.promise);
    return Promise.all(promises);
  }

  discard(): void {
    this.resultCallback = null;
  }

  private finishResult(toolCallId: string, result: ToolResult): void {
    this.emitResult(result);
    const entry = this.pendingResults.get(toolCallId);
    if (entry) {
      entry.resolve(result);
      this.pendingResults.delete(toolCallId);
    }
  }

  private emitResult(result: ToolResult): void {
    this.resultCallback?.(result);
  }
}
