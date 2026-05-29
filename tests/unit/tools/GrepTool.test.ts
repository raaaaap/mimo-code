import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { GrepTool } from '../../../src/tools/GrepTool/GrepTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';

function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

let hasRg = false;
try { execFileSync('rg', ['--version'], { stdio: 'ignore' }); hasRg = true; } catch {}

describe('GrepTool', () => {
  it.runIf(hasRg)('should search for patterns', async () => {
    const tool = GrepTool();
    const result = await tool.call({ pattern: 'buildTool', path: 'src/types' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('buildTool');
  });
  it.skipIf(hasRg)('should return error when rg is not installed', async () => {
    const tool = GrepTool();
    const result = await tool.call({ pattern: 'test', path: '.' }, makeCtx());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('ripgrep');
  });
  it('should be read-only and concurrent-safe', () => {
    const tool = GrepTool();
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
  });
});
