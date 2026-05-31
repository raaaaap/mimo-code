import type { Command } from '../commands.js';
import { costTracker } from './cost.js';
import type { Language } from '../utils/i18n.js';
import { t } from '../utils/i18n.js';

export const usageCommand: Command = {
  name: 'usage',
  description: 'Show token usage for this session',
  isEnabled: () => true,
  call: async (args, context) => {
    const entries = costTracker.getEntries();
    if (entries.length === 0) {
      return context.language === 'zh-CN' ? '本次会话暂无 token 使用记录。' :
             context.language === 'ja' ? 'このセッションのトークン使用記録はありません。' :
             'No token usage recorded this session.';
    }

    const totalInput = entries.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutput = entries.reduce((s, e) => s + e.outputTokens, 0);

    const lines = [
      context.language === 'zh-CN' ? 'Token 使用统计：' :
      context.language === 'ja' ? 'トークン使用統計：' :
      'Token Usage Statistics:',
      '',
      `  Input:  ${totalInput.toLocaleString()} tokens`,
      `  Output: ${totalOutput.toLocaleString()} tokens`,
      `  Total:  ${(totalInput + totalOutput).toLocaleString()} tokens`,
      `  API Calls: ${entries.length}`,
    ];
    return lines.join('\n');
  },
};
