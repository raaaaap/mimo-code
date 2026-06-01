import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'all']).optional().default('all'),
});

export const TaskListTool = buildTool({
  name: 'TaskList',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'List all tasks, optionally filtered by status.',
  prompt: () => 'List tasks. Filter by status or show all.',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const tasks = state.tasks || {};
    let taskList = Object.values(tasks) as any[];
    if (args.status !== 'all') {
      taskList = taskList.filter(t => t.status === args.status);
    }
    return { toolUseId: '', name: 'TaskList', result: JSON.stringify({ count: taskList.length, tasks: taskList }) };
  },
});
