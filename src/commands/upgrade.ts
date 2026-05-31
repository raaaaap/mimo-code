import type { Command } from '../commands.js';

export const upgradeCommand: Command = {
  name: 'upgrade',
  description: 'Check for updates',
  isEnabled: () => true,
  call: async () => {
    return 'Current version: 1.0.0\nCheck https://github.com/raaaaap/mimo-code for updates.';
  },
};
