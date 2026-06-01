export interface ExtractedMemory {
  content: string;
  type: 'fact' | 'preference' | 'decision' | 'context';
  confidence: number;
  timestamp: number;
}

export class MemoryExtractor {
  private memories: ExtractedMemory[] = [];

  async extractFromConversation(messages: Array<{ role: string; content: string }>): Promise<ExtractedMemory[]> {
    const extracted: ExtractedMemory[] = [];

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;

      // Simple heuristic: look for explicit memory markers
      const memoryPatterns = [
        /记住[：:]?\s*(.+)/g,
        /remember[：:]?\s*(.+)/gi,
        /注意[：:]?\s*(.+)/g,
        /note[：:]?\s*(.+)/gi,
      ];

      for (const pattern of memoryPatterns) {
        let match;
        while ((match = pattern.exec(msg.content)) !== null) {
          extracted.push({
            content: match[1].trim(),
            type: 'fact',
            confidence: 0.8,
            timestamp: Date.now(),
          });
        }
      }
    }

    this.memories.push(...extracted);
    return extracted;
  }

  getMemories(): ExtractedMemory[] {
    return [...this.memories];
  }

  getMemoriesByType(type: ExtractedMemory['type']): ExtractedMemory[] {
    return this.memories.filter(m => m.type === type);
  }

  clear(): void {
    this.memories = [];
  }

  export(): string {
    return JSON.stringify(this.memories, null, 2);
  }

  import(data: string): void {
    try {
      this.memories = JSON.parse(data);
    } catch {
      // ignore invalid data
    }
  }
}

export const memoryExtractor = new MemoryExtractor();
