import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  task_id: z.string().describe('Task ID'),
});

export const TaskGetTool = buildTool({
  name: 'TaskGet',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'Get details of a specific task.',
  prompt: () => 'Get task details by ID.',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const task = state.tasks?.[args.task_id];
    if (!task) return { toolUseId: '', name: 'TaskGet', result: '', error: `Task ${args.task_id} not found`, isError: true };
    return { toolUseId: '', name: 'TaskGet', result: JSON.stringify(task) };
  },
});
