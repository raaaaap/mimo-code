import type { Command } from '../commands.js';

export const loginCommand: Command = {
  name: 'login',
  description: 'Authenticate with MiMo API',
  isEnabled: () => true,
  call: async () => {
    return 'To authenticate, set your API key:\n  /config set apiKey sk-your-key-here\n\nOr set environment variable:\n  export MIMO_API_KEY=sk-your-key-here';
  },
};
