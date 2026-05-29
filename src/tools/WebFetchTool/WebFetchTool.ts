import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  url: z.string().url().describe('URL to fetch'),
  prompt: z.string().optional().describe('What to extract from the page'),
});

export const WebFetchTool = () => buildTool({
  name: 'WebFetchTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Fetch a web page and return its content.',
  prompt: () => 'Fetch a URL and return the response body.',
  call: async (args) => {
    try {
      const response = await fetch(args.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) return { toolUseId: '', name: 'WebFetchTool', result: '', error: `HTTP ${response.status}`, isError: true };
      const text = await response.text();
      return { toolUseId: '', name: 'WebFetchTool', result: text.slice(0, 50000) };
    } catch (error) {
      return { toolUseId: '', name: 'WebFetchTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
