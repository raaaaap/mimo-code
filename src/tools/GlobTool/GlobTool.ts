import { glob } from 'glob';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  pattern: z.string().describe('Glob pattern (e.g. "**/*.ts")'),
  path: z.string().optional().describe('Directory to search in (defaults to cwd)'),
});

export const GlobTool = () => buildTool({
  name: 'GlobTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Find files matching a glob pattern.',
  prompt: () => 'Search for files by glob pattern. Returns matching file paths.',
  call: async (args) => {
    try {
      const files = await glob(args.pattern, { cwd: args.path ?? process.cwd(), nodir: true });
      return { toolUseId: '', name: 'GlobTool', result: files.slice(0, 200).join('\n') || 'No files found' };
    } catch (error) {
      return { toolUseId: '', name: 'GlobTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
