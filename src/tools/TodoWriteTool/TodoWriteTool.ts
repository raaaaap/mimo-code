import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const todoSchema = z.object({
  content: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  activeForm: z.string(),
});

const inputSchema = z.object({
  todos: z.array(todoSchema).describe('Updated todo list'),
});

export const TodoWriteTool = () => buildTool({
  name: 'TodoWriteTool',
  inputSchema,
  description: async () => 'Create and manage a task list for tracking progress.',
  prompt: () => 'Update the task list. Pass the full updated list of todos.',
  call: async (args) => {
    const summary = args.todos.map(t => `[${t.status === 'completed' ? 'x' : t.status === 'in_progress' ? '>' : ' '}] ${t.content}`).join('\n');
    return { toolUseId: '', name: 'TodoWriteTool', result: `Updated todo list:\n${summary}` };
  },
});
