import type { Command } from '../commands.js';

export const CLEAR_SENTINET = '[CLEAR]';

export const clearCommand: Command = {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear conversation history',
  isEnabled: () => true,
  call: async () => {
    return CLEAR_SENTINET;
  },
};
