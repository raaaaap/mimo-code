import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional().describe('Task description'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

export const TaskCreateTool = buildTool({
  name: 'TaskCreate',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Create a new task for tracking work.',
  prompt: () => 'Create a task with title, optional description, and priority.',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const id = `task-${Date.now()}`;
    const tasks = state.tasks || {};
    tasks[id] = {
      id,
      title: args.title,
      description: args.description || '',
      priority: args.priority,
      status: 'pending',
      createdAt: Date.now(),
    };
    context.setAppState({ tasks });
    return { toolUseId: '', name: 'TaskCreate', result: JSON.stringify({ id, title: args.title, status: 'pending' }) };
  },
});
