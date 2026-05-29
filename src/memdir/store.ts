import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MemoryEntry, MemoryType } from './types.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/;
const FIELD_RE = /^(\w+):\s*(.*)$/gm;

function serialize(entry: MemoryEntry): string {
  const lines = [
    '---',
    `name: ${entry.name}`,
    `description: ${entry.description}`,
    'metadata:',
    `  type: ${entry.type}`,
    '---',
    '',
    entry.content,
  ];
  return lines.join('\n');
}

function parseFrontmatter(raw: string): MemoryEntry {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error('Invalid memory file: missing frontmatter');
  }

  const [, block, content] = match;
  const fields: Record<string, string> = {};
  let metaType = '';

  for (const line of block.split('\n')) {
    // Handle indented metadata fields like "  type: user"
    const indented = line.match(/^\s+type:\s*(.*)$/);
    if (indented) {
      metaType = indented[1].trim();
      continue;
    }
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (field) {
      fields[field[1]] = field[2].trim();
    }
  }

  const type = (metaType || fields['type']) as MemoryType;
  return {
    name: fields['name'] ?? '',
    description: fields['description'] ?? '',
    type,
    content,
  };
}

export class MemoryStore {
  private dir: string;

  constructor(baseDir: string) {
    this.dir = path.join(baseDir, 'memories');
  }

  save(entry: MemoryEntry): void {
    fs.mkdirSync(this.dir, { recursive: true });
    const filePath = path.join(this.dir, `${entry.name}.md`);
    fs.writeFileSync(filePath, serialize(entry), 'utf-8');
  }

  load(name: string): MemoryEntry | null {
    const filePath = path.join(this.dir, `${name}.md`);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return parseFrontmatter(raw);
  }

  list(): MemoryEntry[] {
    if (!fs.existsSync(this.dir)) return [];
    const files = fs.readdirSync(this.dir).filter((f) => f.endsWith('.md'));
    const entries: MemoryEntry[] = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this.dir, file), 'utf-8');
        entries.push(parseFrontmatter(raw));
      } catch {
        // Skip malformed files
      }
    }
    return entries;
  }

  delete(name: string): boolean {
    const filePath = path.join(this.dir, `${name}.md`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }
}
