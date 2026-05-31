import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { execSync } from 'node:child_process';

const inputSchema = z.object({
  name: z.string().optional().describe('Worktree name'),
  path: z.string().optional().describe('Path to existing worktree'),
});

export const EnterWorktreeTool = buildTool({
  name: 'EnterWorktree',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  description: async () => 'Create and enter a git worktree for isolated work.',
  prompt: () => 'Enter a git worktree for parallel work without affecting the main branch.',
  call: async (args) => {
    const name = args.name || `worktree-${Date.now()}`;
    try {
      const wtPath = `.claude/worktrees/${name}`;
      execSync(`git worktree add ${wtPath} -b ${name}`, { encoding: 'utf-8', timeout: 10000 });
      return {
        toolUseId: '',
        name: 'EnterWorktree',
        result: `Created worktree: ${wtPath}\nBranch: ${name}\nUse ExitWorktree to leave.`,
      };
    } catch (e: any) {
      return {
        toolUseId: '',
        name: 'EnterWorktree',
        result: '',
        error: e.message,
        isError: true,
      };
    }
  },
});
