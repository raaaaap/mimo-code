import type { Command } from '../commands.js';
import { costTracker } from './cost.js';
import type { Language } from '../utils/i18n.js';

export const statsCommand: Command = {
  name: 'stats',
  description: 'Show session statistics',
  isEnabled: () => true,
  call: async (args, context) => {
    const entries = costTracker.getEntries();
    const totalInput = entries.reduce((s, e) => s + e.inputTokens, 0);
    const totalOutput = entries.reduce((s, e) => s + e.outputTokens, 0);
    const totalCost = costTracker.getTotalCost();

    const lines = [
      context.language === 'zh-CN' ? '会话统计：' :
      context.language === 'ja' ? 'セッション統計：' :
      'Session Statistics:',
      '',
      `  API Calls: ${entries.length}`,
      `  Input Tokens: ${totalInput.toLocaleString()}`,
      `  Output Tokens: ${totalOutput.toLocaleString()}`,
      `  Total Cost: $${totalCost.toFixed(4)}`,
    ];
    return lines.join('\n');
  },
};
