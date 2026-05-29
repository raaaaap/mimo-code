import type { Command } from '../commands.js';
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
  call: async () => {
    const entries = costTracker.getEntries();
    const total = costTracker.getTotalCost();
    const byModel = costTracker.getCostByModel();
    const models = Object.keys(byModel);

    if (entries.length === 0) {
      return 'No costs recorded this session.';
    }

    const lines: string[] = [];
    lines.push('Session Cost Breakdown');
    lines.push('─'.repeat(48));

    // Table header
    lines.push(
      padRight('Model', 20) +
        padRight('Input Tokens', 16) +
        padRight('Output Tokens', 16) +
        padRight('Cost', 12),
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
      padRight('Total', 20) +
        padRight('', 16) +
        padRight('', 16) +
        padRight(formatUSD(total), 12),
    );
    lines.push(`\nRequests: ${entries.length}`);

    return lines.join('\n');
  },
};
