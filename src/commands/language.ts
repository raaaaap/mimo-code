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
  call: async (args, context) => {
    const lang: Language = context.language;
    const requested = args.trim();
    if (!requested) {
      const lines = [lang === 'zh-CN' ? '可用语言：' :
                     lang === 'ja' ? '利用可能な言語：' :
                     'Available languages:', ''];
      for (const l of LANGUAGES) {
        const marker = l === 'zh-CN' ? ' (default)' : '';
        lines.push(`  ${l} — ${LANGUAGE_LABELS[l]}${marker}`);
      }
      lines.push('', lang === 'zh-CN' ? '用法：/language <语言代码>' :
                    lang === 'ja' ? '使い方：/language <コード>' :
                    'Usage: /language <code>');
      return lines.join('\n');
    }

    const match = LANGUAGES.find((l) => l === requested);
    if (!match) {
      return lang === 'zh-CN' ? `未知语言"${requested}"。可用：${LANGUAGES.join(', ')}` :
             lang === 'ja' ? `不明な言語"${requested}"。利用可能：${LANGUAGES.join(', ')}` :
             `Unknown language "${requested}". Available: ${LANGUAGES.join(', ')}`;
    }

    return `${LANGUAGE_CHANGE_PREFIX}${match}`;
  },
};
