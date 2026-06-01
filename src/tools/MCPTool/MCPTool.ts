import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  server: z.string().describe('MCP server name'),
  tool: z.string().describe('Tool name on the MCP server'),
  arguments: z.record(z.unknown()).optional().describe('Tool arguments'),
});

export const MCPTool = () => buildTool({
  name: 'MCPTool',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Call a tool on a connected MCP server.',
  prompt: () => 'Invoke a tool on an MCP server. Use ListMcpResources to discover available servers.',
  call: async (args) => {
    return {
      toolUseId: '',
      name: 'MCPTool',
      result: `MCP tool call to ${args.server}/${args.tool} - MCP server integration is being configured. Use ListMcpResources to see available resources.`,
    };
  },
});
