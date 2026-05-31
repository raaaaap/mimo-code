import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  task_id: z.string().describe('任务 ID'),
  block: z.boolean().optional().default(true).describe('是否等待任务完成'),
  timeout: z.number().optional().default(30000).describe('最大等待时间（毫秒）'),
});

export const TaskOutputTool = () => buildTool({
  name: 'TaskOutput',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => '获取后台任务的输出。',
  prompt: () => '获取后台任务输出。可选择阻塞等待任务完成。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    const task = state.tasks?.[args.task_id];
    if (!task) {
      return { toolUseId: '', name: 'TaskOutput', result: '', error: `任务 ${args.task_id} 不存在`, isError: true };
    }
    if (args.block && task.status === 'running') {
      const startTime = Date.now();
      while (Date.now() - startTime < args.timeout) {
        await new Promise(r => setTimeout(r, 100));
        const updated = (context.getAppState() as any).tasks?.[args.task_id];
        if (updated && updated.status !== 'running') {
          return { toolUseId: '', name: 'TaskOutput', result: JSON.stringify({ retrieval_status: 'success', task: { task_id: args.task_id, ...updated } }) };
        }
      }
      return { toolUseId: '', name: 'TaskOutput', result: JSON.stringify({ retrieval_status: 'timeout', task: null }) };
    }
    return { toolUseId: '', name: 'TaskOutput', result: JSON.stringify({ retrieval_status: 'success', task: { task_id: args.task_id, ...task } }) };
  },
});
