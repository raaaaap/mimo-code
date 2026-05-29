import { execSync } from 'node:child_process';

export class WorktreeManager {
  create(name: string, basePath = '.worktrees'): string {
    const path = `${basePath}/${name}`;
    execSync(`git worktree add ${path} -b ${name}`, { cwd: process.cwd() });
    return path;
  }

  remove(name: string, basePath = '.worktrees'): void {
    execSync(`git worktree remove ${basePath}/${name}`, { cwd: process.cwd() });
    try { execSync(`git branch -D ${name}`, { cwd: process.cwd() }); } catch {}
  }

  list(): string[] {
    const output = execSync('git worktree list --porcelain', { cwd: process.cwd(), encoding: 'utf-8' });
    return output.split('\n').filter(l => l.startsWith('worktree ')).map(l => l.slice(9));
  }
}
