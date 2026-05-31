import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';
import type { HistoryStore } from '../history/store.js';

export function createResumeCommand(historyStore: HistoryStore): Command {
  return {
    name: 'resume',
    aliases: ['r'],
    description: 'Resume a previous conversation',
    isEnabled: () => true,
    call: async (args, context) => {
      const lang: Language = context.language;
      const entries = await historyStore.list();
      if (entries.length === 0) {
        return lang === 'zh-CN' ? '未找到会话历史。' :
               lang === 'ja' ? 'セッション履歴が見つかりません。' :
               'No conversation history found.';
      }

      if (args.trim()) {
        const id = args.trim();
        const session = await historyStore.load(id);
        if (!session) {
          return lang === 'zh-CN' ? `未找到会话"${id}"。` :
                 lang === 'ja' ? `セッション"${id}"が見つかりません。` :
                 `Session "${id}" not found.`;
        }
        return lang === 'zh-CN' ? `已恢复会话${id}，共${session.messages.length}条消息。` :
               lang === 'ja' ? `セッション${id}を復元、${session.messages.length}件のメッセージ。` :
               `Resumed session ${id} with ${session.messages.length} messages.`;
      }

      const lines = [lang === 'zh-CN' ? '最近的对话：' :
                     lang === 'ja' ? '最近の会話：' :
                     'Recent conversations:'];
      for (const entry of entries.slice(0, 10)) {
        const date = new Date(entry.timestamp).toLocaleString();
        lines.push(`  ${entry.id} [${date}] ${entry.model} — ${entry.messageCount} ${lang === 'zh-CN' ? '条消息' : lang === 'ja' ? '件のメッセージ' : 'msgs'} — "${entry.preview}"`);
      }
      lines.push(lang === 'zh-CN' ? '\n用法：/resume <id>' :
                 lang === 'ja' ? '\n使い方：/resume <id>' :
                 '\nUsage: /resume <id>');
      return lines.join('\n');
    },
  };
}
