import type { Command } from '../commands.js';
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '../utils/i18n.js';

export const LANGUAGE_CHANGE_PREFIX = 'LANGUAGE_CHANGE:';

export const languageCommand: Command = {
  name: 'language',
  aliases: ['lang', 'locale'],
  description: 'Show or switch the interface language',
  arguments: [
    { name: 'lang', description: 'Language code (zh-CN, en, ja)', required: false },
  ],
  isEnabled: () => true,
  call: async (args, options) => {
    const requested = args.trim();
    if (!requested) {
      const lines = ['可用语言 / Available languages:', ''];
      for (const lang of LANGUAGES) {
        const marker = lang === 'zh-CN' ? ' (default)' : '';
        lines.push(`  ${lang} — ${LANGUAGE_LABELS[lang]}${marker}`);
      }
      lines.push('', '用法 / Usage: /language <code>');
      return lines.join('\n');
    }

    const match = LANGUAGES.find((l) => l === requested);
    if (!match) {
      return `Unknown language "${requested}". Available: ${LANGUAGES.join(', ')}`;
    }

    return `${LANGUAGE_CHANGE_PREFIX}${match}`;
  },
};
