import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { MemoryStore } from '../../../src/memdir/store.js';
import type { MemoryEntry } from '../../../src/memdir/types.js';

let tmpDir: string;
let store: MemoryStore;

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    name: 'test-note',
    description: 'A test memory',
    type: 'user',
    content: 'Hello world',
    ...overrides,
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memdir-test-'));
  store = new MemoryStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('MemoryStore', () => {
  describe('save and load', () => {
    it('should save a memory and load it back', () => {
      const entry = makeEntry();
      store.save(entry);
      const loaded = store.load('test-note');
      expect(loaded).toEqual(entry);
    });

    it('should return null for a non-existent name', () => {
      expect(store.load('nope')).toBeNull();
    });

    it('should persist all fields correctly', () => {
      const entry = makeEntry({
        name: 'proj-info',
        description: 'Project details',
        type: 'project',
        content: 'Line one\nLine two\nLine three',
      });
      store.save(entry);
      expect(store.load('proj-info')).toEqual(entry);
    });

    it('should handle all memory types', () => {
      const types = ['user', 'feedback', 'project', 'reference'] as const;
      for (const type of types) {
        const entry = makeEntry({ name: `note-${type}`, type });
        store.save(entry);
        expect(store.load(`note-${type}`)?.type).toBe(type);
      }
    });
  });

  describe('list', () => {
    it('should return empty array when no memories exist', () => {
      expect(store.list()).toEqual([]);
    });

    it('should list all saved memories', () => {
      store.save(makeEntry({ name: 'a' }));
      store.save(makeEntry({ name: 'b', type: 'feedback' }));
      const list = store.list();
      expect(list).toHaveLength(2);
      expect(list.map((e) => e.name).sort()).toEqual(['a', 'b']);
    });

    it('should skip malformed files', () => {
      store.save(makeEntry({ name: 'good' }));
      fs.writeFileSync(path.join(tmpDir, 'memories', 'bad.md'), 'no frontmatter');
      const list = store.list();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('good');
    });
  });

  describe('delete', () => {
    it('should delete an existing memory and return true', () => {
      store.save(makeEntry());
      expect(store.delete('test-note')).toBe(true);
      expect(store.load('test-note')).toBeNull();
    });

    it('should return false when deleting a non-existent memory', () => {
      expect(store.delete('nope')).toBe(false);
    });
  });

  describe('file format', () => {
    it('should write .md files with YAML frontmatter', () => {
      store.save(makeEntry({ name: 'fmt', description: 'desc', type: 'reference', content: 'body' }));
      const raw = fs.readFileSync(path.join(tmpDir, 'memories', 'fmt.md'), 'utf-8');
      expect(raw).toMatch(/^---\n/);
      expect(raw).toContain('name: fmt');
      expect(raw).toContain('description: desc');
      expect(raw).toContain('  type: reference');
      expect(raw).toContain('\n\nbody');
    });
  });
});
