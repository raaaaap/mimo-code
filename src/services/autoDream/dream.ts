export interface DreamConfig {
  enabled: boolean;
  intervalMs: number;
  maxMemories: number;
}

export class AutoDreamService {
  private config: DreamConfig = {
    enabled: false,
    intervalMs: 30 * 60 * 1000, // 30 minutes
    maxMemories: 100,
  };
  private timer: NodeJS.Timeout | null = null;
  private memories: string[] = [];

  start(): void {
    if (!this.config.enabled) return;
    this.timer = setInterval(() => this.dream(), this.config.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async dream(): Promise<void> {
    // Stub - would consolidate memories
    if (this.memories.length > this.config.maxMemories) {
      this.memories = this.memories.slice(-this.config.maxMemories);
    }
  }

  addMemory(memory: string): void {
    this.memories.push(memory);
  }

  getMemories(): string[] {
    return [...this.memories];
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) this.start();
    else this.stop();
  }

  getConfig(): DreamConfig {
    return { ...this.config };
  }
}

export const autoDream = new AutoDreamService();
