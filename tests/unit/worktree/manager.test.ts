import { describe, it, expect } from 'vitest';
import { WorktreeManager } from '../../../src/worktree/manager';

describe('WorktreeManager', () => {
  it('list() returns at least the main worktree', () => {
    const manager = new WorktreeManager();
    const result = manager.list();
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The first entry should be the current repo root
    expect(result[0]).toContain('mimo-code');
  });
});
