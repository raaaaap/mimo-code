import type { Command } from '../commands.js';

const AVAILABLE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
];

export const modelCommand: Command = {
  name: 'model',
  aliases: ['m'],
  description: 'Show or switch the current model',
  arguments: [
    { name: 'model', description: 'Model name to switch to', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const requested = args.trim();
    if (!requested) {
      return [
        `Current model: ${context.model}`,
        '',
        'Available models:',
        ...AVAILABLE_MODELS.map((m) => `  ${m === context.model ? '* ' : '  '}${m}`),
        '',
        'Usage: /model <name>',
      ].join('\n');
    }

    const match = AVAILABLE_MODELS.find(
      (m) => m === requested || m.includes(requested),
    );
    if (!match) {
      return `Unknown model "${requested}". Available:\n${AVAILABLE_MODELS.join('\n')}`;
    }

    return `Model switch requested to: ${match}\n(Restart session to apply.)`;
  },
};
