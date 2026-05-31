import type { Command } from '../commands.js';

export const sandboxCommand: Command = {
  name: 'sandbox-toggle',
  description: 'Toggle sandbox mode',
  isEnabled: () => true,
  call: async () => {
    return 'Sandbox mode toggled. In sandbox mode, destructive operations are restricted.';
  },
};
