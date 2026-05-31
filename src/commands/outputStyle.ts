import type { Command } from '../commands.js';

export const outputStyleCommand: Command = {
  name: 'output-style',
  description: 'Set output style',
  arguments: [{ name: 'style', description: 'text, json, or markdown', required: false }],
  isEnabled: () => true,
  call: async (args) => {
    const style = args.trim().toLowerCase();
    if (!style) return 'Current output style: text\nUsage: /output-style <text|json|markdown>';
    if (!['text', 'json', 'markdown'].includes(style)) return 'Invalid style. Use: text, json, or markdown';
    return `Output style set to: ${style}`;
  },
};
