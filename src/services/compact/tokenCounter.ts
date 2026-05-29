import type { Message } from '../../types/message.js';

export interface TokenCounter {
  countMessages(messages: Message[]): number;
  countText(text: string): number;
}

export class EstimatedTokenCounter implements TokenCounter {
  private charsPerToken: number;

  constructor(charsPerToken: number = 4) {
    this.charsPerToken = charsPerToken;
  }

  countMessages(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      total += this.countMessage(msg);
    }
    return total;
  }

  countMessage(msg: Message): number {
    let total = 0;
    if (typeof msg.content === 'string') {
      total += this.countText(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.text) total += this.countText(part.text);
      }
    }
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        total += this.countText(tc.function.name);
        total += this.countText(tc.function.arguments);
      }
    }
    if (msg.toolCallId) {
      total += this.countText(msg.toolCallId);
    }
    total += 4; // message overhead (role, formatting)
    return total;
  }

  countText(text: string): number {
    return Math.ceil(text.length / this.charsPerToken);
  }
}
