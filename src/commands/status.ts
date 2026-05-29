import { execSync } from 'child_process';
import type { Command } from '../commands.js';

export const statusCommand: Command = {
  name: 'status',
  aliases: ['st', 'info'],
  description: 'Show session and environment status',
  isEnabled: () => true,
  call: async (_args, context) => {
    const lines: string[] = ['Session Status', '==============', ''];

    // Model
    lines.push(`Model: ${context.model}`);
    lines.push(`Verbose: ${context.verbose}`);
    lines.push(`Debug: ${context.debug}`);
    lines.push('');

    // Uptime
    const uptimeSec = Math.floor(process.uptime());
    const min = Math.floor(uptimeSec / 60);
    const sec = uptimeSec % 60;
    lines.push(`Uptime: ${min}m ${sec}s`);
    lines.push(`Node PID: ${process.pid}`);
    lines.push('');

    // Git status
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      lines.push(`Git branch: ${branch}`);

      const statusOut = execSync('git status --porcelain', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      const changed = statusOut ? statusOut.split('\n').length : 0;
      lines.push(`Changed files: ${changed}`);
    } catch {
      lines.push('Git: not available');
    }

    return lines.join('\n');
  },
};
