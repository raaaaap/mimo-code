import type { Command } from '../commands.js';

export const copyCommand: Command = {
  name: 'copy',
  description: 'Copy last response to clipboard',
  isEnabled: () => true,
  call: async () => {
    return 'Clipboard copy is not yet supported in terminal mode.';
  },
};
