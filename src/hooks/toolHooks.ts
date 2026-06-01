import type { Tool, ToolUseContext, ToolResult } from '../types/tool.js';

export type HookPhase = 'pre' | 'post';

export interface ToolHook {
  name: string;
  phase: HookPhase;
  toolPattern: string | RegExp;
  handler: (context: {
    tool: Tool;
    args: unknown;
    result?: ToolResult;
    phase: HookPhase;
  }) => Promise<{ continue: boolean; modifiedArgs?: unknown; modifiedResult?: ToolResult }>;
}

export class ToolHookRegistry {
  private hooks: ToolHook[] = [];

  register(hook: ToolHook): void {
    this.hooks.push(hook);
  }

  unregister(name: string): void {
    this.hooks = this.hooks.filter(h => h.name !== name);
  }

  getHooksForTool(toolName: string, phase: HookPhase): ToolHook[] {
    return this.hooks.filter(hook => {
      if (hook.phase !== phase) return false;
      if (typeof hook.toolPattern === 'string') {
        return hook.toolPattern === '*' || hook.toolPattern === toolName;
      }
      return hook.toolPattern.test(toolName);
    });
  }

  async executePreHooks(tool: Tool, args: unknown): Promise<{ continue: boolean; modifiedArgs?: unknown }> {
    const hooks = this.getHooksForTool(tool.name, 'pre');
    let currentArgs = args;
    for (const hook of hooks) {
      const result = await hook.handler({ tool, args: currentArgs, phase: 'pre' });
      if (!result.continue) return { continue: false };
      if (result.modifiedArgs) currentArgs = result.modifiedArgs;
    }
    return { continue: true, modifiedArgs: currentArgs };
  }

  async executePostHooks(tool: Tool, args: unknown, result: ToolResult): Promise<{ continue: boolean; modifiedResult?: ToolResult }> {
    const hooks = this.getHooksForTool(tool.name, 'post');
    let currentResult = result;
    for (const hook of hooks) {
      const hookResult = await hook.handler({ tool, args, result: currentResult, phase: 'post' });
      if (!hookResult.continue) return { continue: false };
      if (hookResult.modifiedResult) currentResult = hookResult.modifiedResult;
    }
    return { continue: true, modifiedResult: currentResult };
  }

  getAll(): ToolHook[] {
    return [...this.hooks];
  }
}

export const toolHookRegistry = new ToolHookRegistry();
