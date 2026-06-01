import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  message: z.string().describe('Brief message to send'),
  attachments: z.array(z.string()).optional().describe('File paths to attach'),
  status: z.enum(['info', 'success', 'warning', 'error']).optional().default('info'),
});

export const BriefTool = buildTool({
  name: 'BriefTool',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'Send a brief structured message with optional file attachments.',
  prompt: () => 'Send a brief message with optional attachments and status indicator.',
  call: async (args) => {
    const statusEmoji = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[args.status ?? 'info'];
    const attachments = args.attachments?.length ? `\nAttachments: ${args.attachments.join(', ')}` : '';
    return {
      toolUseId: '',
      name: 'BriefTool',
      result: `${statusEmoji} ${args.message}${attachments}`,
    };
  },
});
