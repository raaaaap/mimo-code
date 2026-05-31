import type { Command } from '../commands.js';

export const contextCommand: Command = {
  name: 'context',
  description: 'Show current context window status',
  isEnabled: () => true,
  call: async () => {
    return 'Context window: active\nUse /compact to reduce context size.';
  },
};
