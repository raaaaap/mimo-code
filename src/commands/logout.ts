import type { Command } from '../commands.js';

export const logoutCommand: Command = {
  name: 'logout',
  description: 'Clear authentication',
  isEnabled: () => true,
  call: async () => {
    return 'To clear authentication, remove your API key from ~/.mimo/settings.json';
  },
};
