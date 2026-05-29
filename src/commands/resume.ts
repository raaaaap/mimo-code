import type { Command } from '../commands.js';
import type { HistoryStore } from '../history/store.js';

export function createResumeCommand(historyStore: HistoryStore): Command {
  return {
    name: 'resume',
    aliases: ['r'],
    description: 'Resume a previous conversation',
    isEnabled: () => true,
    call: async (args) => {
      const entries = await historyStore.list();
      if (entries.length === 0) {
        return 'No conversation history found.';
      }

      if (args.trim()) {
        const id = args.trim();
        const session = await historyStore.load(id);
        if (!session) {
          return `Session "${id}" not found.`;
        }
        return `Resumed session ${id} with ${session.messages.length} messages.`;
      }

      const lines = ['Recent conversations:'];
      for (const entry of entries.slice(0, 10)) {
        const date = new Date(entry.timestamp).toLocaleString();
        lines.push(`  ${entry.id} [${date}] ${entry.model} — ${entry.messageCount} msgs — "${entry.preview}"`);
      }
      lines.push('\nUsage: /resume <id>');
      return lines.join('\n');
    },
  };
}
