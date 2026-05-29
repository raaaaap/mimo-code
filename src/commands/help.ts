import type { Command } from '../commands.js';

export const helpCommand: Command = {
  name: 'help',
  aliases: ['h', '?'],
  description: 'Show available commands',
  isEnabled: () => true,
  call: async () => {
    return [
      'Available commands:',
      '  /help     - Show this help',
      '  /clear    - Clear screen',
      '  /compact  - Compact conversation history',
      '  /config   - Show current configuration',
      '  /exit     - Exit the agent',
      '',
      'Keyboard shortcuts:',
      '  Ctrl+C    - Cancel current operation',
      '  Ctrl+D    - Exit',
      '  Ctrl+L    - Clear screen',
      '  Up/Down   - Navigate history',
      '  Escape    - Clear input',
    ].join('\n');
  },
};
