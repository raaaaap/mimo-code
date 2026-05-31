import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const outputStyleCommand: Command = {
  name: 'output-style',
  description: 'Set output style',
  arguments: [{ name: 'style', description: 'text, json, or markdown', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const style = args.trim().toLowerCase();
    if (!style) return t(context.language, 'cmd_output_style_set') + 'text\n' + t(context.language, 'cmd_output_style_usage');
    if (!['text', 'json', 'markdown'].includes(style)) return t(context.language, 'cmd_output_style_invalid');
    return t(context.language, 'cmd_output_style_set') + style;
  },
};
