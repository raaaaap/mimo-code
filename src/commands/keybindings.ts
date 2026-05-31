import type { Command } from '../commands.js';

export const keybindingsCommand: Command = {
  name: 'keybindings',
  description: 'Show or configure keybindings',
  isEnabled: () => true,
  call: async () => {
    return 'Keybindings:\n  Enter - Submit input\n  Shift+Enter - New line\n  Ctrl+C - Cancel/Exit\n  Ctrl+D - Exit\n  Escape - Clear input\n  Up/Down - Navigate history\n  Tab - Toggle command menu';
  },
};
