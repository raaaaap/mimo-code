import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { queryLoop, type QueryDeps } from '../../query.js';
import type { Message } from '../../types/message.js';
import type { Tool } from '../../types/tool.js';
import type { ModelRequest, StreamChunk } from '../../types/api.js';

export interface AgentToolDeps {
  getTool: (name: string) => Tool | undefined;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  getToolDefinitions: () => ModelRequest['tools'];
}

const inputSchema = z.object({
  prompt: z.string().describe('The task or question for the sub-agent to work on'),
  systemPrompt: z.string().optional().describe('Optional system prompt for the sub-agent'),
});

export const AgentTool = (deps: AgentToolDeps) => buildTool({
  name: 'AgentTool',
  aliases: ['agent', 'subagent'],
  inputSchema,
  description: async () => 'Spawn a sub-agent to handle a task autonomously. The sub-agent has access to the same tools and runs its own query loop until the task is complete.',
  prompt: () => 'Delegate a task to a sub-agent. Provide a clear prompt describing what the sub-agent should accomplish. The sub-agent will run autonomously with access to all available tools.',
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  call: async (args, context) => {
    const subMessages: Message[] = [
      { role: 'user', content: args.prompt },
    ];

    const abortController = new AbortController();

    const subDeps: QueryDeps = {
      callModel: deps.callModel,
      microcompact: (msgs) => msgs,
      autocompact: async (msgs) => msgs,
      uuid: () => crypto.randomUUID(),
      getTool: deps.getTool,
      toolContext: {
        ...context,
        messages: subMessages,
        abortController,
      },
    };

    try {
      const collected: Message[] = [];
      for await (const msg of queryLoop(
        subMessages,
        subDeps,
        {
          model: context.options.model,
          maxTokens: context.options.maxTokens,
          temperature: context.options.temperature,
          abortSignal: abortController.signal,
        },
        args.systemPrompt,
        deps.getToolDefinitions(),
      )) {
        collected.push(msg);
      }

      const lastAssistant = [...collected].reverse().find(m => m.role === 'assistant');
      const resultText = lastAssistant && typeof lastAssistant.content === 'string'
        ? lastAssistant.content
        : 'Sub-agent completed with no text response.';

      return { toolUseId: '', name: 'AgentTool', result: resultText };
    } catch (error) {
      return {
        toolUseId: '',
        name: 'AgentTool',
        result: '',
        error: error instanceof Error ? error.message : String(error),
        isError: true,
      };
    }
  },
});
