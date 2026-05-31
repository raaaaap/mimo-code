import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  uri: z.string().describe('The URI of the MCP resource to read'),
});

export const ReadMcpResourceTool = () => buildTool({
  name: 'ReadMcpResource',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'Read an MCP resource by URI.',
  prompt: () => 'Read the content of an MCP resource.',
  call: async (args) => {
    return {
      toolUseId: '',
      name: 'ReadMcpResource',
      result: `Resource ${args.uri}: No MCP servers connected.`,
    };
  },
});
