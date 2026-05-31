import type { Command } from '../commands.js';

export const envCommand: Command = {
  name: 'env',
  description: 'Show relevant environment variables',
  isEnabled: () => true,
  call: async () => {
    const vars = [
      `MIMO_API_KEY: ${process.env.MIMO_API_KEY ? '****' + process.env.MIMO_API_KEY.slice(-4) : '(not set)'}`,
      `MIMO_BASE_URL: ${process.env.MIMO_BASE_URL ?? '(not set)'}`,
      `MIMO_MODEL: ${process.env.MIMO_MODEL ?? '(not set)'}`,
      `NODE_ENV: ${process.env.NODE_ENV ?? '(not set)'}`,
    ];
    return 'Environment:\n  ' + vars.join('\n  ');
  },
};
