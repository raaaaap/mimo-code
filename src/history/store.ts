import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { HistoryEntry, HistoryIndex } from './types.js';

const MAX_ENTRIES = 100;

export class HistoryStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = baseDir;
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async save(entry: HistoryEntry): Promise<void> {
    await this.init();
    const filePath = join(this.dir, `${entry.id}.json`);
    await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
    await this.prune();
  }

  async load(id: string): Promise<HistoryEntry | null> {
    try {
      const filePath = join(this.dir, `${id}.json`);
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data) as HistoryEntry;
    } catch {
      return null;
    }
  }

  async list(): Promise<HistoryIndex['entries']> {
    try {
      await this.init();
      const files = await readdir(this.dir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const entries: HistoryIndex['entries'] = [];
      for (const file of jsonFiles) {
        try {
          const data = await readFile(join(this.dir, file), 'utf-8');
          const entry = JSON.parse(data) as HistoryEntry;
          const preview = entry.messages
            .filter((m) => m.role === 'user')
            .map((m) => (typeof m.content === 'string' ? m.content : '[complex]'))
            .slice(0, 2)
            .join(' ');

          entries.push({
            id: entry.id,
            timestamp: entry.timestamp,
            model: entry.model,
            messageCount: entry.messages.length,
            preview: preview.slice(0, 100),
          });
        } catch {
          // Skip corrupted files
        }
      }

      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filePath = join(this.dir, `${id}.json`);
      await unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  private async prune(): Promise<void> {
    const entries = await this.list();
    if (entries.length > MAX_ENTRIES) {
      const toRemove = entries.slice(MAX_ENTRIES);
      for (const entry of toRemove) {
        await this.delete(entry.id);
      }
    }
  }
}
