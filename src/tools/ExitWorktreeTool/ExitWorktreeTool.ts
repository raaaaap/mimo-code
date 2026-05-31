import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { execSync } from 'node:child_process';

const inputSchema = z.object({
  action: z.enum(['keep', 'remove']).optional().default('keep').describe('Keep or remove worktree'),
});

export const ExitWorktreeTool = buildTool({
  name: 'ExitWorktree',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  description: async () => 'Exit and optionally remove a git worktree.',
  prompt: () => 'Exit the current worktree. Use action: remove to delete it.',
  call: async (args) => {
    try {
      if (args.action === 'remove') {
        execSync('git worktree prune', { encoding: 'utf-8', timeout: 5000 });
      }
      return {
        toolUseId: '',
        name: 'ExitWorktree',
        result: `Worktree ${args.action === 'remove' ? 'removed' : 'kept'}.`,
      };
    } catch (e: any) {
      return {
        toolUseId: '',
        name: 'ExitWorktree',
        result: '',
        error: e.message,
        isError: true,
      };
    }
  },
});
