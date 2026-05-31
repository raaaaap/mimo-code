import type { Command } from '../commands.js';

export const filesCommand: Command = {
  name: 'files',
  description: 'List files modified in this session',
  isEnabled: () => true,
  call: async () => {
    return 'Files modified in this session:\n  (tracking not yet implemented)';
  },
};
