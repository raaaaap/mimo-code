import type { Command } from '../commands.js';

export const tasksCommand: Command = {
  name: 'tasks',
  aliases: ['task', 'bg'],
  description: 'List and manage background tasks',
  arguments: [
    { name: 'action', description: 'Action: list, stop', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const action = args.trim().toLowerCase();

    if (!action || action === 'list') {
      return [
        'Background Tasks',
        '================',
        'No running background tasks.',
        '',
        'Actions:',
        '  /tasks list        — List tasks (this view)',
        '  /tasks stop <id>   — Stop a task by ID',
      ].join('\n');
    }

    if (action.startsWith('stop')) {
      const id = action.replace('stop', '').trim();
      if (!id) {
        return 'Usage: /tasks stop <task-id>';
      }
      return `Task ${id} stop requested.`;
    }

    return `Unknown action "${action}". Use: list, stop`;
  },
};
