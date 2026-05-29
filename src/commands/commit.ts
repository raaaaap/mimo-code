import { execSync } from 'child_process';
import type { Command } from '../commands.js';

export const commitCommand: Command = {
  name: 'commit',
  aliases: ['ci'],
  description: 'Stage all changes and create a git commit',
  arguments: [
    { name: 'message', description: 'Commit message', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const message = args.trim() || 'chore: auto-commit from mimo-code';
    try {
      execSync('git add -A', { encoding: 'utf-8', stdio: 'pipe' });
      const result = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return result.trim() || 'Commit created successfully.';
    } catch (err: any) {
      const stderr = err.stderr?.toString?.() || err.message;
      if (stderr.includes('nothing to commit')) {
        return 'Nothing to commit — working tree clean.';
      }
      return `Commit failed: ${stderr}`;
    }
  },
};
