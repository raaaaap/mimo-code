export interface Tip {
  id: string;
  category: 'general' | 'tools' | 'shortcuts' | 'efficiency';
  message: string;
  conditions?: {
    minSessions?: number;
    maxSessions?: number;
    toolsUsed?: string[];
  };
}

const TIPS: Tip[] = [
  { id: 'tab-menu', category: 'shortcuts', message: 'Press Tab to see your most frequently used commands.' },
  { id: 'help-categories', category: 'general', message: 'Use /help <category> to see commands in a specific category.' },
  { id: 'plan-mode', category: 'efficiency', message: 'Use /plan to enter planning mode before complex tasks.' },
  { id: 'memory', category: 'effort', message: 'Use /memory to save important information across sessions.' },
  { id: 'copy', category: 'shortcuts', message: 'Use /copy to copy the last response to clipboard.' },
  { id: 'language', category: 'general', message: 'Use /language to switch between Chinese, English, and Japanese.' },
  { id: 'cost', category: 'general', message: 'Use /cost to see your token usage and estimated costs.' },
  { id: 'export', category: 'tools', message: 'Use /export to save your conversation to a file.' },
];

export class TipsService {
  private shownTips = new Set<string>();
  private sessionCount = 0;

  constructor() {
    this.sessionCount = 0;
  }

  incrementSession(): void {
    this.sessionCount++;
  }

  getNextTip(): Tip | null {
    const available = TIPS.filter(t => !this.shownTips.has(t.id));
    if (available.length === 0) {
      this.shownTips.clear();
      return TIPS[0];
    }
    const tip = available[Math.floor(Math.random() * available.length)];
    this.shownTips.add(tip.id);
    return tip;
  }

  getTipsByCategory(category: string): Tip[] {
    return TIPS.filter(t => t.category === category);
  }

  getAllTips(): Tip[] {
    return [...TIPS];
  }

  markShown(tipId: string): void {
    this.shownTips.add(tipId);
  }

  reset(): void {
    this.shownTips.clear();
  }
}

export const tipsService = new TipsService();
