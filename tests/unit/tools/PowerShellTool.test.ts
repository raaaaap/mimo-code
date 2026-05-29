import { describe, it, expect } from 'vitest';
import { PowerShellTool } from '../../../src/tools/PowerShellTool/PowerShellTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';

function makeCtx(): ToolUseContext {
  return {
    options: { model: 'test' },
    abortController: new AbortController(),
    readFileState: new Map(),
    messages: [],
    toolDecisions: new Map(),
    requestPrompt: async () => '',
    getAppState: () => ({}),
    setAppState: () => {},
  };
}

describe('PowerShellTool', () => {
  it('should execute a simple command', async () => {
    const tool = PowerShellTool();
    const result = await tool.call({ command: 'Write-Output hello' }, makeCtx());
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('hello');
  });

  it('should report exit code on failure', async () => {
    const tool = PowerShellTool();
    const result = await tool.call({ command: 'exit 1' }, makeCtx());
    expect(result.isError).toBe(true);
  });

  it('should not be read-only', () => {
    const tool = PowerShellTool();
    expect(tool.isReadOnly()).toBe(false);
    expect(tool.isDestructive()).toBe(true);
  });

  it('should have expected aliases', () => {
    const tool = PowerShellTool();
    expect(tool.aliases).toContain('powershell');
    expect(tool.aliases).toContain('pwsh');
  });

  it('should block dangerous commands via validateInput', () => {
    const tool = PowerShellTool();
    const result = tool.validateInput?.({ command: 'Format-Volume -DriveLetter C' });
    expect(result?.valid).toBe(false);
    expect(result?.error).toBeDefined();
  });

  it('should block dangerous Remove-Item -Recurse -Force via call', async () => {
    const tool = PowerShellTool();
    const result = await tool.call({ command: 'Remove-Item C:\\ -Recurse -Force' }, makeCtx());
    expect(result.isError).toBe(true);
    expect(result.error).toContain('Blocked dangerous command');
  });

  it('should allow safe commands via validateInput', () => {
    const tool = PowerShellTool();
    const result = tool.validateInput?.({ command: 'Get-Process' });
    expect(result?.valid).toBe(true);
  });
});
