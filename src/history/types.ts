import type { Message, TokenUsage } from '../types/message.js';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  model: string;
  messages: Message[];
  totalUsage: TokenUsage;
}

export interface HistoryIndex {
  entries: Array<{
    id: string;
    timestamp: number;
    model: string;
    messageCount: number;
    preview: string;
  }>;
}
