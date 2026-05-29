import { execFile } from 'node:child_process';
import type { Hook, HookEvent, HookContext, HookResult } from './types.js';

const DEFAULT_TIMEOUT = 10_000;

export class HookRegistry {
  private hooks = new Map<string, Hook>();
  private nextId = 0;

  /** Register a hook. Returns the assigned hook id. */
  register(hook: Omit<Hook, 'id'>): string {
    const id = `hook_${this.nextId++}`;
    this.hooks.set(id, { ...hook, id });
    return id;
  }

  /** Unregister a hook by id. Returns true if it existed. */
  unregister(id: string): boolean {
    return this.hooks.delete(id);
  }

  /** Get all hooks, optionally filtered by event. */
  getHooks(event?: HookEvent): Hook[] {
    const all = Array.from(this.hooks.values());
    return event ? all.filter((h) => h.event === event) : all;
  }

  /** Execute all hooks for a given event, in registration order. */
  async execute(event: HookEvent, context: HookContext = {}): Promise<HookResult[]> {
    const hooks = this.getHooks(event);
    const results: HookResult[] = [];

    for (const hook of hooks) {
      // Skip non-command hooks (agent hooks are placeholders for future use)
      if (hook.type !== 'command') continue;
      if (!hook.command) continue;

      // Evaluate condition if present
      if (hook.if) {
        try {
          const condFn = new Function('context', `return ${hook.if}`);
          if (!condFn(context)) continue;
        } catch {
          // Condition evaluation failed — skip hook
          results.push({ success: false, error: `Condition evaluation failed: ${hook.if}` });
          continue;
        }
      }

      const result = await this.runCommand(hook, context);

      if (hook.async) {
        // Fire-and-forget: don't await the result in the caller's flow,
        // but still collect the promise for observability
        results.push(result);
      } else {
        results.push(await result);
      }
    }

    return results;
  }

  private runCommand(hook: Hook, context: HookContext): Promise<HookResult> {
    const timeout = hook.timeout ?? DEFAULT_TIMEOUT;

    return new Promise((resolve) => {
      const env = {
        ...process.env,
        MIMO_CONTEXT: JSON.stringify(context),
        MIMO_HOOK_EVENT: hook.event,
        MIMO_HOOK_ID: hook.id,
      };

      const child = execFile(
        'bash',
        ['-c', hook.command!],
        { env, timeout, windowsHide: true },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              output: stdout ?? '',
              error: error.message,
            });
          } else {
            resolve({
              success: true,
              output: stdout ?? '',
            });
          }
        },
      );

      // For async hooks, resolve immediately
      if (hook.async) {
        resolve({ success: true, output: '' });
      }
    });
  }
}
