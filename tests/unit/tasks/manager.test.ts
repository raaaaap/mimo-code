import { describe, it, expect, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { TaskManager } from '../../../src/tasks/manager.js';

function waitForStatus(
  manager: TaskManager,
  id: string,
  target: string,
  timeoutMs = 5000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const task = manager.getTask(id);
      if (task && task.status === target) return resolve();
      if (Date.now() > deadline) return reject(new Error(`Timed out waiting for status "${target}", last saw "${task?.status}"`));
      setTimeout(check, 20);
    };
    check();
  });
}

describe('TaskManager', () => {
  let manager: TaskManager;

  afterEach(async () => {
    await manager.cleanup();
  });

  it('should create a shell task that completes successfully', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('echo hello');

    expect(task.id).toBeTruthy();
    expect(task.type).toBe('shell');
    expect(task.status).toBe('running');
    expect(task.command).toBe('echo hello');
    expect(task.pid).toBeTypeOf('number');
    expect(task.outputFile).toBeTruthy();

    await waitForStatus(manager, task.id, 'completed');

    const updated = manager.getTask(task.id)!;
    expect(updated.status).toBe('completed');
    expect(updated.exitCode).toBe(0);
    expect(updated.completedAt).toBeTypeOf('number');

    const output = await readFile(updated.outputFile, 'utf-8');
    expect(output.trim()).toBe('hello');
  });

  it('should mark a task as failed on non-zero exit', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('exit 42');

    await waitForStatus(manager, task.id, 'failed');

    const updated = manager.getTask(task.id)!;
    expect(updated.status).toBe('failed');
    expect(updated.exitCode).toBe(42);
  });

  it('should capture stderr output', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('echo err >&2');

    await waitForStatus(manager, task.id, 'completed');

    const updated = manager.getTask(task.id)!;
    const output = await readFile(updated.outputFile, 'utf-8');
    expect(output.trim()).toBe('err');
  });

  it('should list all tasks', async () => {
    manager = new TaskManager();
    await manager.createShellTask('echo a');
    await manager.createShellTask('echo b');

    const tasks = manager.listTasks();
    expect(tasks.length).toBe(2);
    expect(tasks[0].id).not.toBe(tasks[1].id);
  });

  it('should return undefined for unknown task id', () => {
    manager = new TaskManager();
    expect(manager.getTask('nonexistent')).toBeUndefined();
  });

  it('should kill a running task', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('sleep 30');

    expect(task.status).toBe('running');
    const killed = manager.killTask(task.id);
    expect(killed).toBe(true);

    await waitForStatus(manager, task.id, 'killed');

    const updated = manager.getTask(task.id)!;
    expect(updated.status).toBe('killed');
  });

  it('should return false when killing a non-existent task', () => {
    manager = new TaskManager();
    expect(manager.killTask('nope')).toBe(false);
  });

  it('should return false when killing an already completed task', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('echo done');
    await waitForStatus(manager, task.id, 'completed');

    expect(manager.killTask(task.id)).toBe(false);
  });

  it('should handle a task that writes multi-line output', async () => {
    manager = new TaskManager();
    const task = await manager.createShellTask('echo "line1"; echo "line2"; echo "line3"');

    await waitForStatus(manager, task.id, 'completed');

    const updated = manager.getTask(task.id)!;
    const output = await readFile(updated.outputFile, 'utf-8');
    expect(output.trim()).toBe('line1\nline2\nline3');
  });
});
