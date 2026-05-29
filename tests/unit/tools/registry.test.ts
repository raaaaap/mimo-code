import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../../../src/tools.js';
import { buildTool } from '../../../src/types/tool.js';
import { z } from 'zod';

describe('ToolRegistry', () => {
  const mockTool = buildTool({
    name: 'TestTool',
    inputSchema: z.object({ input: z.string() }),
    call: async (args) => ({ toolUseId: '1', name: 'TestTool', result: args.input }),
  });

  it('should register and retrieve a tool', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    expect(registry.get('TestTool')).toBe(mockTool);
  });

  it('should return undefined for unknown tool', () => {
    const registry = new ToolRegistry();
    expect(registry.get('Unknown')).toBeUndefined();
  });

  it('should get all registered tools', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    const all = registry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('TestTool');
  });

  it('should convert tools to OpenAI function definitions', () => {
    const registry = new ToolRegistry();
    registry.register(mockTool);
    const defs = registry.toToolDefinitions();
    expect(defs).toHaveLength(1);
    expect(defs[0].type).toBe('function');
    expect(defs[0].function.name).toBe('TestTool');
  });

  it('should find tool by alias', () => {
    const tool = buildTool({
      name: 'BashTool',
      aliases: ['bash', 'sh'],
      inputSchema: z.object({ command: z.string() }),
      call: async (args) => ({ toolUseId: '1', name: 'BashTool', result: '' }),
    });
    const registry = new ToolRegistry();
    registry.register(tool);
    expect(registry.get('bash')).toBe(tool);
    expect(registry.get('sh')).toBe(tool);
  });
});
