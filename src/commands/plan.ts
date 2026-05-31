import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const PLAN_MODE_PREFIX = 'PLAN_MODE:';

export const planCommand: Command = {
  name: 'plan',
  aliases: ['p'],
  description: 'Enter plan mode — analyze and plan without executing',
  arguments: [
    { name: 'task', description: 'What to plan', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const task = args.trim();
    if (!task) {
      const lines = [
        context.language === 'zh-CN' ? '计划模式' :
        context.language === 'ja' ? 'プランモード' :
        'Plan Mode',
        '================',
        context.language === 'zh-CN' ? '进入计划模式，分析和规划而不执行更改。' :
        context.language === 'ja' ? 'プランモードでは、変更を実行せずに分析と計画を行います。' :
        'Enter plan mode to analyze and plan without executing changes.',
        '',
        context.language === 'zh-CN' ? '用法：/plan <任务描述>' :
        context.language === 'ja' ? '使い方：/plan <タスク説明>' :
        'Usage: /plan <task description>',
        '',
        context.language === 'zh-CN' ? '示例：/plan 重构认证模块使用 JWT' :
        context.language === 'ja' ? '例：/plan 認証モジュールをJWTにリファクタリング' :
        'Example: /plan refactor the auth module to use JWT',
      ];
      return lines.join('\n');
    }

    // Return special prefix that REPL can detect to enter plan mode
    return `${PLAN_MODE_PREFIX}${task}`;
  },
};
