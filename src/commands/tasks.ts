import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const tasksCommand: Command = {
  name: 'tasks',
  aliases: ['task', 'bg'],
  description: 'List and manage background tasks',
  arguments: [
    { name: 'action', description: 'Action: list, stop', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const action = args.trim().toLowerCase();

    if (!action || action === 'list') {
      return [
        context.language === 'zh-CN' ? '后台任务' :
        context.language === 'ja' ? 'バックグラウンドタスク' :
        'Background Tasks',
        '================',
        context.language === 'zh-CN' ? '没有运行中的后台任务。' :
        context.language === 'ja' ? '実行中のバックグラウンドタスクはありません。' :
        'No running background tasks.',
        '',
        context.language === 'zh-CN' ? '操作：' :
        context.language === 'ja' ? '操作：' :
        'Actions:',
        '  /tasks list        — ' + (context.language === 'zh-CN' ? '列出任务（当前视图）' : context.language === 'ja' ? 'タスク一覧（このビュー）' : 'List tasks (this view)'),
        '  /tasks stop <id>   — ' + (context.language === 'zh-CN' ? '按 ID 停止任务' : context.language === 'ja' ? 'ID でタスクを停止' : 'Stop a task by ID'),
      ].join('\n');
    }

    if (action.startsWith('stop')) {
      const id = action.replace('stop', '').trim();
      if (!id) {
        return context.language === 'zh-CN' ? '用法：/tasks stop <task-id>' :
               context.language === 'ja' ? '使い方：/tasks stop <task-id>' :
               'Usage: /tasks stop <task-id>';
      }
      return context.language === 'zh-CN' ? `任务 ${id} 停止请求已发送。` :
             context.language === 'ja' ? `タスク ${id} の停止リクエストが送信されました。` :
             `Task ${id} stop requested.`;
    }

    return context.language === 'zh-CN' ? `未知操作 "${action}"。使用：list、stop` :
           context.language === 'ja' ? `不明な操作 "${action}"。使用：list、stop` :
           `Unknown action "${action}". Use: list, stop`;
  },
};
