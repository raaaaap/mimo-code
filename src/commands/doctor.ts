import { execSync } from 'child_process';
import type { Command } from '../commands.js';

export const doctorCommand: Command = {
  name: 'doctor',
  aliases: ['diag', 'check'],
  description: 'Check environment health: node, git, API key, and settings',
  isEnabled: () => true,
  call: async () => {
    const checks: string[] = [];

    // Node version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      checks.push(`[ok] Node.js: ${nodeVersion}`);
    } catch {
      checks.push('[fail] Node.js: not found');
    }

    // Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      checks.push(`[ok] Git: ${gitVersion}`);
    } catch {
      checks.push('[fail] Git: not found');
    }

    // npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      checks.push(`[ok] npm: v${npmVersion}`);
    } catch {
      checks.push('[warn] npm: not found');
    }

    // API key
    const hasApiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);
    checks.push(hasApiKey ? '[ok] API key: set' : '[warn] API key: not found in environment');

    // Model
    const model = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'default';
    checks.push(`[info] Model env: ${model}`);

    // Git repo check
    try {
      execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf-8', stdio: 'pipe' });
      checks.push('[ok] Inside git repository');
    } catch {
      checks.push('[warn] Not inside a git repository');
    }

    return checks.join('\n');
  },
};
