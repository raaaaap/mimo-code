import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  task_id: z.string().describe('要停止的任务 ID'),
});

export const TaskStopTool = () => buildTool({
  name: 'TaskStop',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '停止一个正在运行的后台任务。',
  prompt: () => '停止后台任务。传入任务 ID。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const task = state.tasks?.[args.task_id];
    if (!task) {
      return { toolUseId: '', name: 'TaskStop', result: '', error: `任务 ${args.task_id} 不存在`, isError: true };
    }
    if (task.status !== 'running') {
      return { toolUseId: '', name: 'TaskStop', result: '', error: `任务 ${args.task_id} 未在运行`, isError: true };
    }
    const tasks = { ...state.tasks };
    tasks[args.task_id] = { ...task, status: 'stopped', completedAt: Date.now() };
    context.setAppState({ tasks } as any);
    return {
      toolUseId: '', name: 'TaskStop',
      result: JSON.stringify({ message: '任务已停止', task_id: args.task_id, task_type: task.type }),
    };
  },
});
