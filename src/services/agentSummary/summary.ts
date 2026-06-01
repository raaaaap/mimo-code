export interface AgentSummary {
  agentId: string;
  task: string;
  status: 'running' | 'completed' | 'failed';
  progress: string;
  startTime: number;
  endTime?: number;
  result?: string;
}

export class AgentSummaryService {
  private summaries = new Map<string, AgentSummary>();

  start(agentId: string, task: string): void {
    this.summaries.set(agentId, {
      agentId,
      task,
      status: 'running',
      progress: 'Starting...',
      startTime: Date.now(),
    });
  }

  updateProgress(agentId: string, progress: string): void {
    const summary = this.summaries.get(agentId);
    if (summary) {
      summary.progress = progress;
    }
  }

  complete(agentId: string, result: string): void {
    const summary = this.summaries.get(agentId);
    if (summary) {
      summary.status = 'completed';
      summary.result = result;
      summary.endTime = Date.now();
    }
  }

  fail(agentId: string, error: string): void {
    const summary = this.summaries.get(agentId);
    if (summary) {
      summary.status = 'failed';
      summary.result = error;
      summary.endTime = Date.now();
    }
  }

  get(agentId: string): AgentSummary | undefined {
    return this.summaries.get(agentId);
  }

  getAll(): AgentSummary[] {
    return Array.from(this.summaries.values());
  }

  getRunning(): AgentSummary[] {
    return Array.from(this.summaries.values()).filter(s => s.status === 'running');
  }

  getSummaryText(): string {
    const all = this.getAll();
    if (all.length === 0) return 'No agent tasks recorded.';

    return all.map(s => {
      const duration = s.endTime ? ((s.endTime - s.startTime) / 1000).toFixed(1) + 's' : 'running...';
      const status = { running: '\u{1F504}', completed: '✅', failed: '❌' }[s.status];
      return `${status} ${s.task} (${duration})`;
    }).join('\n');
  }

  clear(): void {
    this.summaries.clear();
  }
}

export const agentSummary = new AgentSummaryService();
