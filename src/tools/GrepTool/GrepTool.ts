import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const execFileAsync = promisify(execFile);

const inputSchema = z.object({
  pattern: z.string().describe('Regex pattern to search for'),
  path: z.string().optional().describe('File or directory to search in'),
  glob: z.string().optional().describe('Glob pattern to filter files (e.g. "*.ts")'),
});

export const GrepTool = () => buildTool({
  name: 'GrepTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Search file contents using ripgrep.',
  prompt: () => 'Search for text patterns in files using ripgrep. Supports regex.',
  call: async (args) => {
    try {
      const rgArgs = ['--no-heading', '-n'];
      if (args.glob) rgArgs.push('--glob', args.glob);
      rgArgs.push(args.pattern);
      if (args.path) rgArgs.push(args.path);
      const { stdout } = await execFileAsync('rg', rgArgs, { timeout: 30000, maxBuffer: 1024 * 1024 });
      return { toolUseId: '', name: 'GrepTool', result: stdout.trim() || 'No matches found' };
    } catch (error: any) {
      if (error.code === 'ENOENT') return { toolUseId: '', name: 'GrepTool', result: '', error: 'ripgrep (rg) not found.', isError: true };
      if (error.status === 1) return { toolUseId: '', name: 'GrepTool', result: 'No matches found' };
      return { toolUseId: '', name: 'GrepTool', result: '', error: error.message, isError: true };
    }
  },
});
