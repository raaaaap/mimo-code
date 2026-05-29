import { spawn, ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TaskState, TaskStatus } from './types.js';

interface ManagedTask {
  state: TaskState;
  process: ChildProcess;
}

export class TaskManager {
  private tasks = new Map<string, ManagedTask>();

  async createShellTask(command: string): Promise<TaskState> {
    const id = randomUUID();
    const tempDir = await mkdtemp(join(tmpdir(), 'mimo-task-'));
    const outputFile = join(tempDir, 'output.log');

    const state: TaskState = {
      id,
      type: 'shell',
      status: 'pending',
      command,
      pid: null,
      outputFile,
      createdAt: Date.now(),
      completedAt: null,
      exitCode: null,
    };

    const child = spawn('bash', ['-c', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    state.pid = child.pid ?? null;
    state.status = 'running';

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    const managed: ManagedTask = { state, process: child };
    this.tasks.set(id, managed);

    child.on('close', async (code) => {
      const output = Buffer.concat([...stdoutChunks, ...stderrChunks]).toString('utf-8');
      await writeFile(outputFile, output, 'utf-8');

      if (managed.state.status === 'killed') {
        managed.state.exitCode = code ?? null;
        managed.state.completedAt = Date.now();
      } else {
        managed.state.exitCode = code ?? null;
        managed.state.status = code === 0 ? 'completed' : 'failed';
        managed.state.completedAt = Date.now();
      }
    });

    child.on('error', async (err) => {
      const output = Buffer.concat([...stdoutChunks, ...stderrChunks]).toString('utf-8');
      await writeFile(outputFile, output + '\n' + err.message, 'utf-8');
      managed.state.status = 'failed';
      managed.state.exitCode = null;
      managed.state.completedAt = Date.now();
    });

    return { ...state };
  }

  getTask(id: string): TaskState | undefined {
    const managed = this.tasks.get(id);
    return managed ? { ...managed.state } : undefined;
  }

  listTasks(): TaskState[] {
    return Array.from(this.tasks.values()).map((m) => ({ ...m.state }));
  }

  killTask(id: string): boolean {
    const managed = this.tasks.get(id);
    if (!managed) return false;
    if (managed.state.status !== 'running' && managed.state.status !== 'pending') return false;

    managed.state.status = 'killed';
    try {
      managed.process.kill('SIGTERM');
    } catch {
      // Process may have already exited
    }
    return true;
  }

  async cleanup(): Promise<void> {
    for (const managed of this.tasks.values()) {
      if (managed.state.status === 'running') {
        this.killTask(managed.state.id);
      }
      try {
        await rm(managed.state.outputFile, { force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    this.tasks.clear();
  }
}
