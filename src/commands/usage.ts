import type { Command } from '../commands.js';

export const usageCommand: Command = {
  name: 'usage',
  aliases: ['u', 'tokens'],
  description: 'Show token usage statistics for the current session',
  isEnabled: () => true,
  call: async (_args, context) => {
    return [
      'Token Usage Statistics',
      '=====================',
      `Model: ${context.model}`,
      '',
      'Session-level token tracking is not yet wired up.',
      'Check your API dashboard for billing details:',
      '  https://console.anthropic.com/settings/usage',
    ].join('\n');
  },
};
