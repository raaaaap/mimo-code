import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionStore, type SessionData } from '../../../src/session/store.js';
import type { Message } from '../../../src/types/message.js';

function makeSession(id: string, overrides?: Partial<SessionData>): SessionData {
  const messages: Message[] = [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
  ];
  return {
    id,
    messages,
    model: 'test-model',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('SessionStore', () => {
  let tmpDir: string;
  let store: SessionStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'session-test-'));
    store = new SessionStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('save / load', () => {
    it('should save and load a session', async () => {
      const session = makeSession('s1');
      await store.save(session);
      const loaded = await store.load('s1');
      expect(loaded).toEqual(session);
    });

    it('should return null for non-existent session', async () => {
      const loaded = await store.load('does-not-exist');
      expect(loaded).toBeNull();
    });

    it('should overwrite an existing session on save', async () => {
      const session = makeSession('s1', { model: 'old-model' });
      await store.save(session);

      const updated = makeSession('s1', { model: 'new-model' });
      await store.save(updated);

      const loaded = await store.load('s1');
      expect(loaded?.model).toBe('new-model');
    });
  });

  describe('list', () => {
    it('should return empty array when no sessions exist', async () => {
      const sessions = await store.list();
      expect(sessions).toEqual([]);
    });

    it('should list all sessions sorted by updatedAt descending', async () => {
      const s1 = makeSession('s1', { updatedAt: 1000 });
      const s2 = makeSession('s2', { updatedAt: 3000 });
      const s3 = makeSession('s3', { updatedAt: 2000 });

      await store.save(s1);
      await store.save(s2);
      await store.save(s3);

      const sessions = await store.list();
      expect(sessions).toHaveLength(3);
      expect(sessions[0].id).toBe('s2');
      expect(sessions[1].id).toBe('s3');
      expect(sessions[2].id).toBe('s1');
    });
  });

  describe('delete', () => {
    it('should delete a session', async () => {
      const session = makeSession('s1');
      await store.save(session);

      await store.delete('s1');
      const loaded = await store.load('s1');
      expect(loaded).toBeNull();
    });

    it('should not throw when deleting non-existent session', async () => {
      await expect(store.delete('nope')).resolves.toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist messages correctly', async () => {
      const messages: Message[] = [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
      ];
      const session = makeSession('s1', { messages });
      await store.save(session);

      const loaded = await store.load('s1');
      expect(loaded?.messages).toHaveLength(3);
      expect(loaded?.messages[0].role).toBe('system');
      expect(loaded?.messages[2].content).toBe('4');
    });
  });
});
