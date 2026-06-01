import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

interface CronJob {
  id: string;
  cron: string;
  prompt: string;
  recurring: boolean;
  createdAt: number;
  lastRun?: number;
}

const cronJobs = new Map<string, CronJob>();

const inputSchema = z.object({
  action: z.enum(['create', 'delete', 'list']).describe('Action to perform'),
  cron: z.string().optional().describe('Cron expression (e.g., "0 9 * * *" for daily at 9am)'),
  prompt: z.string().optional().describe('Prompt to execute'),
  recurring: z.boolean().optional().default(true).describe('Whether to repeat'),
  job_id: z.string().optional().describe('Job ID for delete action'),
});

export const ScheduleCronTool = buildTool({
  name: 'ScheduleCron',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Schedule recurring or one-shot tasks with cron expressions.',
  prompt: () => 'Create, delete, or list scheduled tasks. Use standard cron format.',
  call: async (args) => {
    if (args.action === 'create') {
      if (!args.cron || !args.prompt) {
        return { toolUseId: '', name: 'ScheduleCron', result: '', error: 'cron and prompt required', isError: true };
      }
      const id = `cron-${Date.now()}`;
      cronJobs.set(id, { id, cron: args.cron, prompt: args.prompt, recurring: args.recurring ?? true, createdAt: Date.now() });
      return { toolUseId: '', name: 'ScheduleCron', result: JSON.stringify({ id, cron: args.cron, prompt: args.prompt, recurring: args.recurring }) };
    }

    if (args.action === 'delete') {
      if (!args.job_id) return { toolUseId: '', name: 'ScheduleCron', result: '', error: 'job_id required', isError: true };
      const deleted = cronJobs.delete(args.job_id);
      return { toolUseId: '', name: 'ScheduleCron', result: deleted ? `Deleted job ${args.job_id}` : `Job ${args.job_id} not found` };
    }

    if (args.action === 'list') {
      const jobs = Array.from(cronJobs.values());
      return { toolUseId: '', name: 'ScheduleCron', result: JSON.stringify({ count: jobs.length, jobs }) };
    }

    return { toolUseId: '', name: 'ScheduleCron', result: '', error: 'Invalid action', isError: true };
  },
});
