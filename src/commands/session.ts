import type { Command } from '../commands.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const sessionCommand: Command = {
  name: 'session',
  description: 'Session management',
  arguments: [{ name: 'action', description: 'list, new, or clear', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const action = args.trim() || 'list';
    const sessionDir = join(homedir(), '.mimo', 'sessions');

    if (action === 'list') {
      try {
        const files = await readdir(sessionDir);
        if (files.length === 0) {
          return context.language === 'zh-CN' ? '没有保存的会话。' :
                 context.language === 'ja' ? '保存されたセッションはありません。' :
                 'No saved sessions.';
        }
        const lines = [context.language === 'zh-CN' ? '会话列表：' :
                       context.language === 'ja' ? 'セッション一覧：' :
                       'Sessions:'];
        for (const f of files.slice(-10)) {
          lines.push(`  ${f}`);
        }
        return lines.join('\n');
      } catch {
        return context.language === 'zh-CN' ? '没有保存的会话。' :
               context.language === 'ja' ? '保存されたセッションはありません。' :
               'No saved sessions.';
      }
    }

    if (action === 'new') {
      return context.language === 'zh-CN' ? '新会话已创建。使用 /clear 清除当前对话。' :
             context.language === 'ja' ? '新しいセッションが作成されました。' :
             'New session created. Use /clear to clear current conversation.';
    }

    return context.language === 'zh-CN' ? '用法：/session [list|new|clear]' :
           context.language === 'ja' ? '使い方：/session [list|new|clear]' :
           'Usage: /session [list|new|clear]';
  },
};
