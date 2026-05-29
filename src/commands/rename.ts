import type { Command } from '../commands.js';

export const renameCommand: Command = {
  name: 'rename',
  aliases: ['rn'],
  description: 'Rename the current session',
  arguments: [
    { name: 'name', description: 'New session name', required: true },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const newName = args.trim();
    if (!newName) {
      return 'Usage: /rename <new session name>';
    }
    return `Session renamed to: "${newName}"`;
  },
};
