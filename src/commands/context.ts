import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const contextCommand: Command = {
  name: 'context',
  description: 'Show current context window status',
  isEnabled: () => true,
  call: async (args, context) => {
    const lines = [
      context.language === 'zh-CN' ? '上下文信息：' :
      context.language === 'ja' ? 'コンテキスト情報：' :
      'Context Information:',
      '',
      `  Model: ${context.model}`,
      `  Verbose: ${context.verbose ? 'on' : 'off'}`,
      `  Debug: ${context.debug ? 'on' : 'off'}`,
      `  Language: ${context.language}`,
    ];
    return lines.join('\n');
  },
};
