import { describe, it, expect, beforeEach } from 'vitest';
import { HookRegistry } from '../../../src/hooks/registry.js';
import type { HookEvent } from '../../../src/hooks/types.js';

describe('HookRegistry', () => {
  let registry: HookRegistry;

  beforeEach(() => {
    registry = new HookRegistry();
  });

  describe('register / getHooks', () => {
    it('should register a hook and return an id', () => {
      const id = registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo hello',
      });
      expect(id).toMatch(/^hook_\d+$/);
    });

    it('should list all hooks', () => {
      registry.register({ event: 'PreToolUse', type: 'command', command: 'echo a' });
      registry.register({ event: 'PostToolUse', type: 'command', command: 'echo b' });
      expect(registry.getHooks()).toHaveLength(2);
    });

    it('should filter hooks by event', () => {
      registry.register({ event: 'PreToolUse', type: 'command', command: 'echo a' });
      registry.register({ event: 'PostToolUse', type: 'command', command: 'echo b' });
      registry.register({ event: 'PreToolUse', type: 'command', command: 'echo c' });

      const preHooks = registry.getHooks('PreToolUse');
      expect(preHooks).toHaveLength(2);
      expect(preHooks.every((h) => h.event === 'PreToolUse')).toBe(true);
    });

    it('should return empty array for event with no hooks', () => {
      expect(registry.getHooks('SessionStart')).toHaveLength(0);
    });
  });

  describe('unregister', () => {
    it('should remove a hook by id', () => {
      const id = registry.register({ event: 'Compact', type: 'command', command: 'echo x' });
      expect(registry.getHooks()).toHaveLength(1);
      expect(registry.unregister(id)).toBe(true);
      expect(registry.getHooks()).toHaveLength(0);
    });

    it('should return false for unknown id', () => {
      expect(registry.unregister('nonexistent')).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute a simple command hook', async () => {
      registry.register({
        event: 'SessionStart',
        type: 'command',
        command: 'echo "hello from hook"',
      });

      const results = await registry.execute('SessionStart');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].output).toContain('hello from hook');
    });

    it('should pass context as MIMO_CONTEXT env var', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo "$MIMO_CONTEXT"',
      });

      const results = await registry.execute('PreToolUse', { toolName: 'Bash', cwd: '/tmp' });
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      const parsed = JSON.parse(results[0].output!.trim());
      expect(parsed.toolName).toBe('Bash');
      expect(parsed.cwd).toBe('/tmp');
    });

    it('should report failure for a bad command', async () => {
      registry.register({
        event: 'SessionEnd',
        type: 'command',
        command: 'exit 1',
      });

      const results = await registry.execute('SessionEnd');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it('should skip agent-type hooks', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'agent',
      });

      const results = await registry.execute('PreToolUse');
      expect(results).toHaveLength(0);
    });

    it('should skip hooks without a command', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        // no command field
      });

      const results = await registry.execute('PreToolUse');
      expect(results).toHaveLength(0);
    });

    it('should skip hooks when condition evaluates to false', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo should-not-run',
        if: 'context.toolName === "NonExistent"',
      });

      const results = await registry.execute('PreToolUse', { toolName: 'Bash' });
      expect(results).toHaveLength(0);
    });

    it('should run hooks when condition evaluates to true', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo conditioned',
        if: 'context.toolName === "Bash"',
      });

      const results = await registry.execute('PreToolUse', { toolName: 'Bash' });
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].output).toContain('conditioned');
    });

    it('should handle async hooks', async () => {
      registry.register({
        event: 'Compact',
        type: 'command',
        command: 'sleep 0.1 && echo async-done',
        async: true,
      });

      const results = await registry.execute('Compact');
      expect(results).toHaveLength(1);
      // Async hooks resolve immediately
      expect(results[0].success).toBe(true);
    });

    it('should respect custom timeout', async () => {
      registry.register({
        event: 'SessionStart',
        type: 'command',
        command: 'sleep 5',
        timeout: 100,
      });

      const results = await registry.execute('SessionStart');
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    }, 5000);

    it('should execute multiple hooks in order', async () => {
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo first',
      });
      registry.register({
        event: 'PreToolUse',
        type: 'command',
        command: 'echo second',
      });

      const results = await registry.execute('PreToolUse');
      expect(results).toHaveLength(2);
      expect(results[0].output).toContain('first');
      expect(results[1].output).toContain('second');
    });

    it('should return empty results when no hooks match event', async () => {
      registry.register({ event: 'SessionStart', type: 'command', command: 'echo x' });
      const results = await registry.execute('SessionEnd');
      expect(results).toHaveLength(0);
    });
  });
});
