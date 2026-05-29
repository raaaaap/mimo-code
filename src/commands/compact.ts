import type { Command } from '../commands.js';

export const compactCommand: Command = {
  name: 'compact',
  description: 'Compact conversation history',
  isEnabled: () => true,
  call: async () => 'Conversation compacted.',
};
