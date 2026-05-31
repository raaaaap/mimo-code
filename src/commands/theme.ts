import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';
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
  call: async (args, context) => {
    const lang: Language = context.language;
    const requested = args.trim();
    if (!requested) {
      const lines = [lang === 'zh-CN' ? '可用主题：' :
                     lang === 'ja' ? '利用可能なテーマ：' :
                     'Available themes:', ''];
      for (const name of THEME_NAMES) {
        const theme = THEMES[name];
        const marker = name === 'mimo-dark' ? ' (default)' : '';
        lines.push(`  ${theme.colors.primary}●${theme.colors.foreground} ${name}${marker}`);
      }
      lines.push('', lang === 'zh-CN' ? '用法：/theme <名称>' :
                    lang === 'ja' ? '使い方：/theme <名前>' :
                    'Usage: /theme <name>');
      return lines.join('\n');
    }

    const match = THEME_NAMES.find((t) => t === requested);
    if (!match) {
      return lang === 'zh-CN' ? `未知主题"${requested}"。可用：${THEME_NAMES.join(', ')}` :
             lang === 'ja' ? `不明なテーマ"${requested}"。利用可能：${THEME_NAMES.join(', ')}` :
             `Unknown theme "${requested}". Available: ${THEME_NAMES.join(', ')}`;
    }

    // Return special prefix that REPL will detect and use to update store
    return `${THEME_CHANGE_PREFIX}${match}`;
  },
};
