import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import type { Message } from '../types/message.js';

export interface SessionData {
  id: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export class SessionStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = join(baseDir, 'sessions');
  }

  async save(session: SessionData): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(
      join(this.dir, `${session.id}.json`),
      JSON.stringify(session, null, 2),
    );
  }

  async load(id: string): Promise<SessionData | null> {
    try {
      const data = await readFile(join(this.dir, `${id}.json`), 'utf-8');
      return JSON.parse(data) as SessionData;
    } catch {
      return null;
    }
  }

  async list(): Promise<SessionData[]> {
    try {
      await mkdir(this.dir, { recursive: true });
      const files = (await readdir(this.dir)).filter((f) => f.endsWith('.json'));
      const sessions: SessionData[] = [];
      for (const f of files) {
        try {
          const data = await readFile(join(this.dir, f), 'utf-8');
          sessions.push(JSON.parse(data) as SessionData);
        } catch {
          // skip corrupted files
        }
      }
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await unlink(join(this.dir, `${id}.json`));
    } catch {
      // ignore if file doesn't exist
    }
  }
}
