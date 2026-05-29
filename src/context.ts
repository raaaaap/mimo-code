import { execSync } from 'node:child_process';

export interface SystemContext {
  gitBranch?: string;
  gitStatus?: string;
  gitRecentCommits?: string;
  cwd: string;
  date: string;
}

export function getSystemContext(): SystemContext {
  const cwd = process.cwd();
  const date = new Date().toISOString().split('T')[0];

  let gitBranch: string | undefined;
  let gitStatus: string | undefined;
  let gitRecentCommits: string | undefined;

  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* not a git repo */ }

  try {
    gitStatus = execSync('git status --short', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* ignore */ }

  try {
    gitRecentCommits = execSync('git log --oneline -5', { cwd, encoding: 'utf-8' }).trim();
  } catch { /* ignore */ }

  return { gitBranch, gitStatus, gitRecentCommits, cwd, date };
}

export function formatSystemContext(ctx: SystemContext): string {
  const parts: string[] = [];
  parts.push(`Working directory: ${ctx.cwd}`);
  parts.push(`Date: ${ctx.date}`);
  if (ctx.gitBranch) parts.push(`Git branch: ${ctx.gitBranch}`);
  if (ctx.gitStatus) parts.push(`Git status:\n${ctx.gitStatus}`);
  if (ctx.gitRecentCommits) parts.push(`Recent commits:\n${ctx.gitRecentCommits}`);
  return parts.join('\n');
}
