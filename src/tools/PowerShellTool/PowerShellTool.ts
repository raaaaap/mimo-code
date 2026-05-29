import { spawn } from 'node:child_process';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

/** Dangerous PowerShell patterns that should be blocked outright. */
const DANGEROUS_PATTERNS: RegExp[] = [
  /Remove-Item\s+.*-Recurse\s+.*-Force/i,
  /Format-Volume/i,
  /Clear-Disk/i,
  /Remove-Partition/i,
  /Stop-Computer/i,
  /Restart-Computer/i,
  /Remove-Item\s+.*\\?\*/i,
  /Invoke-Expression\s+.*Invoke-WebRequest/i,
  /\brm\s+-rf\s+[\/\\]/i,
];

function analyzeCommand(command: string): { safe: boolean; reason?: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return { safe: false, reason: `Blocked dangerous command matching pattern: ${pattern.source}` };
    }
  }
  return { safe: true };
}

const inputSchema = z.object({
  command: z.string().describe('PowerShell command to execute'),
  timeout: z.number().optional().default(120000).describe('Timeout in milliseconds'),
});

export const PowerShellTool = () => buildTool({
  name: 'PowerShellTool',
  aliases: ['powershell', 'pwsh'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Execute a PowerShell command on Windows and return stdout/stderr.',
  prompt: () => 'Run a PowerShell command on Windows. Returns stdout and stderr.',
  validateInput: (args) => {
    const check = analyzeCommand(args.command);
    if (!check.safe) return { valid: false, error: check.reason };
    return { valid: true };
  },
  call: async (args) => {
    const check = analyzeCommand(args.command);
    if (!check.safe) {
      return {
        toolUseId: '',
        name: 'PowerShellTool',
        result: '',
        error: check.reason,
        isError: true,
      };
    }

    return new Promise((resolve) => {
      const parts: string[] = [];
      const errParts: string[] = [];

      const psExe = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
      const proc = spawn(psExe, ['-NoProfile', '-NonInteractive', '-Command', args.command], {
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
        if (code !== 0) {
          resolve({
            toolUseId: '',
            name: 'PowerShellTool',
            result: combined,
            error: `Exit code ${code}`,
            isError: true,
          });
        } else {
          resolve({
            toolUseId: '',
            name: 'PowerShellTool',
            result: combined || '(no output)',
          });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          toolUseId: '',
          name: 'PowerShellTool',
          result: '',
          error: err.message,
          isError: true,
        });
      });

      proc.stdin.end();
    });
  },
});
