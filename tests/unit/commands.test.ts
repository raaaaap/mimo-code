import { describe, it, expect } from 'vitest';
import { CommandRegistry } from '../../src/commands.js';
import type { Command } from '../../src/commands.js';

describe('CommandRegistry', () => {
  const helpCommand: Command = {
    name: 'help',
    description: 'Show help',
    isEnabled: () => true,
    call: async () => 'Help text',
  };

  it('should register and retrieve a command', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    expect(registry.get('help')).toBe(helpCommand);
  });

  it('should parse slash command from input', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    const result = registry.parse('/help');
    expect(result).not.toBeNull();
    expect(result!.command.name).toBe('help');
    expect(result!.args).toBe('');
  });

  it('should parse slash command with args', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    const result = registry.parse('/help tools');
    expect(result!.args).toBe('tools');
  });

  it('should return null for non-command input', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    expect(registry.parse('hello world')).toBeNull();
  });

  it('should get all commands', () => {
    const registry = new CommandRegistry();
    registry.register(helpCommand);
    registry.register({
      name: 'clear',
      description: 'Clear screen',
      isEnabled: () => true,
      call: async () => {},
    });
    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });
});
