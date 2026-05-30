import type { Command } from '../commands.js';
import { THEME_NAMES, THEMES } from '../utils/themes.js';

export const THEME_CHANGE_PREFIX = 'THEME_CHANGE:';

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
      const lines = ['Available themes:', ''];
      for (const name of THEME_NAMES) {
        const theme = THEMES[name];
        const marker = name === 'mimo-dark' ? ' (default)' : '';
        lines.push(`  ${theme.colors.primary}●${theme.colors.foreground} ${name}${marker}`);
      }
      lines.push('', 'Usage: /theme <name>');
      return lines.join('\n');
    }

    const match = THEME_NAMES.find((t) => t === requested);
    if (!match) {
      return `Unknown theme "${requested}". Available: ${THEME_NAMES.join(', ')}`;
    }

    // Return special prefix that REPL will detect and use to update store
    return `${THEME_CHANGE_PREFIX}${match}`;
  },
};
