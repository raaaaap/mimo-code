import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const effortCommand: Command = {
  name: 'effort',
  description: 'Adjust reasoning effort level',
  arguments: [{ name: 'level', description: 'low, medium, or high', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const level = args.trim().toLowerCase();
    if (!level) return t(context.language, 'cmd_effort_set') + 'medium\n' + t(context.language, 'cmd_effort_usage');
    if (!['low', 'medium', 'high'].includes(level)) return t(context.language, 'cmd_effort_invalid');
    return t(context.language, 'cmd_effort_set') + level;
  },
};
