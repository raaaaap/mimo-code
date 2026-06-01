import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface SessionMemoryData {
  sessionId: string;
  files: string[];
  workflow: string;
  errors: string[];
  learnings: string[];
  lastUpdated: string;
}

export class SessionMemory {
  private dir: string;

  constructor() {
    this.dir = join(homedir(), '.mimo', 'memory');
  }

  async save(data: SessionMemoryData): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const filePath = join(this.dir, `${data.sessionId}.json`);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async load(sessionId: string): Promise<SessionMemoryData | null> {
    try {
      const filePath = join(this.dir, `${sessionId}.json`);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as SessionMemoryData;
    } catch {
      return null;
    }
  }

  async list(): Promise<SessionMemoryData[]> {
    try {
      const files = await readdir(this.dir);
      const memories: SessionMemoryData[] = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await readFile(join(this.dir, file), 'utf-8');
          memories.push(JSON.parse(content) as SessionMemoryData);
        } catch { /* skip */ }
      }
      return memories.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    } catch {
      return [];
    }
  }

  async generateSummary(sessionId: string): Promise<string> {
    const memory = await this.load(sessionId);
    if (!memory) return 'No session memory found.';

    const parts = [
      `Session: ${sessionId}`,
      `Last updated: ${memory.lastUpdated}`,
      '',
      'Files worked on:',
      ...memory.files.map(f => `  - ${f}`),
      '',
      'Workflow:',
      `  ${memory.workflow}`,
    ];

    if (memory.errors.length > 0) {
      parts.push('', 'Errors encountered:', ...memory.errors.map(e => `  - ${e}`));
    }

    if (memory.learnings.length > 0) {
      parts.push('', 'Learnings:', ...memory.learnings.map(l => `  - ${l}`));
    }

    return parts.join('\n');
  }
}

export const sessionMemory = new SessionMemory();
