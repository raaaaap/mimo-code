import type { Command } from '../commands.js';

export const REWIND_PREFIX = 'REWIND:';

export const rewindCommand: Command = {
  name: 'rewind',
  description: 'Undo last N conversation turns',
  arguments: [{ name: 'count', description: 'Number of turns to rewind (default: 1)', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const count = parseInt(args.trim()) || 1;
    if (count < 1 || count > 20) {
      return context.language === 'zh-CN' ? '数量应在 1-20 之间。' :
             context.language === 'ja' ? '数は1〜20の間で指定してください。' :
             'Count must be between 1 and 20.';
    }
    return `${REWIND_PREFIX}${count}`;
  },
};
