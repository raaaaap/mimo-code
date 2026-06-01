import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface MagicDoc {
  file: string;
  header: string;
  content: string;
  lastUpdated: string;
}

export class MagicDocsService {
  async scan(directory: string): Promise<MagicDoc[]> {
    const docs: MagicDoc[] = [];
    try {
      const files = await readdir(directory);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        try {
          const content = await readFile(join(directory, file), 'utf-8');
          const headerMatch = content.match(/^# MAGIC DOC:\s*(.+)$/m);
          if (headerMatch) {
            docs.push({
              file: join(directory, file),
              header: headerMatch[1].trim(),
              content,
              lastUpdated: new Date().toISOString(),
            });
          }
        } catch { /* skip */ }
      }
    } catch { /* directory doesn't exist */ }
    return docs;
  }

  async update(filePath: string, newContent: string): Promise<boolean> {
    try {
      await writeFile(filePath, newContent, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  async getSummary(directory: string): Promise<string> {
    const docs = await this.scan(directory);
    if (docs.length === 0) return 'No magic docs found.';
    return docs.map(d => `- ${d.header} (${d.file})`).join('\n');
  }
}

export const magicDocs = new MagicDocsService();
