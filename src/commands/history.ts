import type { Command } from '../commands.js';
import { SessionStore } from '../session/store.js';
import { homedir } from 'node:os';
import { t } from '../utils/i18n.js';

export const historyCommand: Command = {
  name: 'history',
  description: 'Show session history',
  isEnabled: () => true,
  call: async (args, context) => {
    const store = new SessionStore(homedir() + '/.mimo');
    const sessions = await store.list();
    if (sessions.length === 0) {
      return context.language === 'zh-CN' ? '没有会话历史。\n\n会话会在对话结束后自动保存。' :
             context.language === 'ja' ? 'セッション履歴はありません。\n\n会話終了後に自動保存されます。' :
             'No session history.\n\nSessions are saved automatically after conversations.';
    }
    const lines = [
      context.language === 'zh-CN' ? '最近的会话：' :
      context.language === 'ja' ? '最近のセッション：' :
      'Recent sessions:',
      '',
    ];
    for (const s of sessions.slice(0, 10)) {
      const date = new Date(s.createdAt).toLocaleString();
      lines.push(`  ${s.id} — ${s.model} — ${date} — ${s.messages.length} messages`);
    }
    lines.push('');
    lines.push(context.language === 'zh-CN' ? '使用 /resume <id> 恢复会话' :
               context.language === 'ja' ? '/resume <id> でセッションを復元' :
               'Use /resume <id> to resume a session');
    return lines.join('\n');
  },
};
