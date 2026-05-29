import { describe, it, expect } from 'vitest';
import { GlobTool } from '../../../src/tools/GlobTool/GlobTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';

function makeCtx(): ToolUseContext { return { options: { model: 'test' }, abortController: new AbortController(), readFileState: new Map(), messages: [], toolDecisions: new Map(), requestPrompt: async () => '', getAppState: () => ({}), setAppState: () => {} }; }

describe('GlobTool', () => {
  it('should find TypeScript files', async () => {
    const tool = GlobTool();
    const result = await tool.call({ pattern: 'src/types/*.ts' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('message.ts');
  });
  it('should be read-only and concurrent-safe', () => {
    const tool = GlobTool();
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
  });
});
