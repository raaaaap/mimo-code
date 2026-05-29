import type { Command } from '../commands.js';

const THEMES = ['dark', 'light', 'solarized', 'monokai', 'dracula', 'nord'];

export const themeCommand: Command = {
  name: 'theme',
  aliases: ['t'],
  description: 'Show or switch the color theme',
  arguments: [
    { name: 'theme', description: 'Theme name to switch to', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const requested = args.trim();
    if (!requested) {
      return [
        'Available themes:',
        ...THEMES.map((t) => `  - ${t}`),
        '',
        'Usage: /theme <name>',
      ].join('\n');
    }

    const match = THEMES.find((t) => t === requested);
    if (!match) {
      return `Unknown theme "${requested}". Available: ${THEMES.join(', ')}`;
    }

    return `Theme set to: ${match}`;
  },
};
