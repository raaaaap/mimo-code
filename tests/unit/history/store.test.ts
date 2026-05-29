import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HistoryStore } from '../../../src/history/store.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('HistoryStore', () => {
  let tmpDir: string;
  let store: HistoryStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mimo-test-'));
    store = new HistoryStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and loads a session', async () => {
    await store.save({
      id: 'test-1',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ],
      totalUsage: { inputTokens: 100, outputTokens: 50 },
    });

    const entries = await store.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.id).toBe('test-1');
    expect(entries[0]!.model).toBe('mimo-large');
  });

  it('loads messages for a specific session', async () => {
    await store.save({
      id: 'test-2',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [{ role: 'user', content: 'test' }],
      totalUsage: { inputTokens: 10, outputTokens: 5 },
    });

    const session = await store.load('test-2');
    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(1);
  });

  it('returns null for non-existent session', async () => {
    const session = await store.load('nonexistent');
    expect(session).toBeNull();
  });

  it('limits to 100 entries', async () => {
    for (let i = 0; i < 105; i++) {
      await store.save({
        id: `test-${i}`,
        timestamp: Date.now() - (105 - i) * 1000,
        model: 'mimo-large',
        messages: [],
        totalUsage: { inputTokens: 0, outputTokens: 0 },
      });
    }

    const entries = await store.list();
    expect(entries.length).toBeLessThanOrEqual(100);
  });

  it('deletes a session', async () => {
    await store.save({
      id: 'test-del',
      timestamp: Date.now(),
      model: 'mimo-large',
      messages: [],
      totalUsage: { inputTokens: 0, outputTokens: 0 },
    });

    await store.delete('test-del');
    const session = await store.load('test-del');
    expect(session).toBeNull();
  });
});
