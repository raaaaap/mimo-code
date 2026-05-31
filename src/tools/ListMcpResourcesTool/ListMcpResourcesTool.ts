import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({});

export const ListMcpResourcesTool = () => buildTool({
  name: 'ListMcpResources',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'List available MCP resources.',
  prompt: () => 'List all available MCP resources from connected servers.',
  call: async () => {
    return {
      toolUseId: '',
      name: 'ListMcpResources',
      result: JSON.stringify({ resources: [], message: 'No MCP servers connected.' }),
    };
  },
});
