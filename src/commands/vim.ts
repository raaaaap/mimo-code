import type { Command } from '../commands.js';

export const vimCommand: Command = {
  name: 'vim',
  description: 'Toggle vim keybinding mode',
  isEnabled: () => true,
  call: async () => {
    return 'Vim mode toggled. Vim keybindings are now active.\nUse /keybindings to see available keys.';
  },
};
