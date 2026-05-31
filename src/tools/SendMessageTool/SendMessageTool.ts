import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { messageBus } from '../../services/messageBus.js';

const inputSchema = z.object({
  to: z.string().describe('接收者 ID，或 "*" 广播'),
  message: z.string().describe('消息内容'),
  summary: z.string().optional().describe('5-10 字摘要'),
});

export const SendMessageTool = () => buildTool({
  name: 'SendMessage',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '向其他代理发送消息。',
  prompt: () => '向其他代理发送消息。用 "*" 广播给所有代理。',
  call: async (args, context) => {
    const from = (context.getAppState() as any).currentAgentId || 'main';
    messageBus.send(args.to, {
      id: crypto.randomUUID(), from, to: args.to,
      content: args.message, summary: args.summary, timestamp: Date.now(),
    });
    return { toolUseId: '', name: 'SendMessage', result: JSON.stringify({ sent: true, to: args.to, from }) };
  },
});
