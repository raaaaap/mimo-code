import { spawn } from 'node:child_process';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  timeout: z.number().optional().default(120000).describe('Timeout in milliseconds'),
});

export const BashTool = () => buildTool({
  name: 'BashTool',
  aliases: ['bash', 'sh'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Execute a shell command and return stdout/stderr.',
  prompt: () => 'Run a shell command. Returns stdout and stderr.',
  call: async (args) => {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'powershell.exe' : 'bash';
      const shellArgs = isWindows ? ['-Command', args.command] : ['-c', args.command];

      const parts: string[] = [];
      const errParts: string[] = [];
      const proc = spawn(shell, shellArgs, {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const timeout = setTimeout(() => proc.kill('SIGTERM'), args.timeout ?? 120000);
      proc.stdout.on('data', (data: Buffer) => parts.push(data.toString()));
      proc.stderr.on('data', (data: Buffer) => errParts.push(data.toString()));
      proc.on('close', (code) => {
        clearTimeout(timeout);
        const combined = [parts.join(''), errParts.join('')].filter(Boolean).join('');
        if (code !== 0) resolve({ toolUseId: '', name: 'BashTool', result: combined, error: `Exit code ${code}`, isError: true });
        else resolve({ toolUseId: '', name: 'BashTool', result: combined || '(no output)' });
      });
      proc.on('error', (err) => { clearTimeout(timeout); resolve({ toolUseId: '', name: 'BashTool', result: '', error: err.message, isError: true }); });
      proc.stdin.end();
    });
  },
});
