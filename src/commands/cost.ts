import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';
import { CostTracker } from '../cost-tracker.js';

/**
 * Global cost tracker instance shared across the session.
 * Import this in other modules to call `tracker.record(model, usage)`.
 */
export const costTracker = new CostTracker();

function formatUSD(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

export const costCommand: Command = {
  name: 'cost',
  description: 'Show cost breakdown for this session',
  isEnabled: () => true,
  call: async (_args, context) => {
    const lang: Language = context.language;
    const entries = costTracker.getEntries();
    const total = costTracker.getTotalCost();
    const byModel = costTracker.getCostByModel();
    const models = Object.keys(byModel);

    if (entries.length === 0) {
      return lang === 'zh-CN' ? '本次会话暂无费用记录。' :
             lang === 'ja' ? 'このセッションのコスト記録はありません。' :
             'No costs recorded this session.';
    }

    const lines: string[] = [];
    lines.push(lang === 'zh-CN' ? '会话费用明细' :
               lang === 'ja' ? 'セッションコスト明細' :
               'Session Cost Breakdown');
    lines.push('─'.repeat(48));

    // Table header
    lines.push(
      padRight(lang === 'zh-CN' ? '模型' : lang === 'ja' ? 'モデル' : 'Model', 20) +
        padRight(lang === 'zh-CN' ? '输入Token' : lang === 'ja' ? '入力トークン' : 'Input Tokens', 16) +
        padRight(lang === 'zh-CN' ? '输出Token' : lang === 'ja' ? '出力トークン' : 'Output Tokens', 16) +
        padRight(lang === 'zh-CN' ? '费用' : lang === 'ja' ? 'コスト' : 'Cost', 12),
    );
    lines.push('─'.repeat(48));

    // Per-model summary rows
    for (const model of models) {
      const modelEntries = entries.filter((e) => e.model === model);
      const inputTokens = modelEntries.reduce((s, e) => s + e.inputTokens, 0);
      const outputTokens = modelEntries.reduce((s, e) => s + e.outputTokens, 0);
      const cost = byModel[model];

      lines.push(
        padRight(model, 20) +
          padRight(inputTokens.toLocaleString(), 16) +
          padRight(outputTokens.toLocaleString(), 16) +
          padRight(formatUSD(cost), 12),
      );
    }

    lines.push('─'.repeat(48));
    lines.push(
      padRight(lang === 'zh-CN' ? '总计' : lang === 'ja' ? '合計' : 'Total', 20) +
        padRight('', 16) +
        padRight('', 16) +
        padRight(formatUSD(total), 12),
    );
    lines.push(`\n${lang === 'zh-CN' ? '请求数' : lang === 'ja' ? 'リクエスト数' : 'Requests'}: ${entries.length}`);

    return lines.join('\n');
  },
};
