import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const vimCommand: Command = {
  name: 'vim',
  description: 'Toggle vim keybinding mode',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_vim_toggled') + '\n' + t(context.language, 'cmd_vim_hint');
  },
};
