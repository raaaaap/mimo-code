import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  task_id: z.string().describe('Task ID'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const TaskUpdateTool = buildTool({
  name: 'TaskUpdate',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Update a task\'s status, title, or description.',
  prompt: () => 'Update task properties.',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const tasks = state.tasks || {};
    if (!tasks[args.task_id]) return { toolUseId: '', name: 'TaskUpdate', result: '', error: `Task ${args.task_id} not found`, isError: true };
    if (args.status) tasks[args.task_id].status = args.status;
    if (args.title) tasks[args.task_id].title = args.title;
    if (args.description) tasks[args.task_id].description = args.description;
    tasks[args.task_id].updatedAt = Date.now();
    context.setAppState({ tasks });
    return { toolUseId: '', name: 'TaskUpdate', result: JSON.stringify(tasks[args.task_id]) };
  },
});
