export interface BusMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  summary?: string;
  timestamp: number;
}

type MessageHandler = (msg: BusMessage) => void;

class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();
  private queues = new Map<string, BusMessage[]>();

  send(to: string, message: BusMessage): void {
    const handlers = this.handlers.get(to);
    if (handlers) {
      for (const handler of handlers) handler(message);
    } else {
      const queue = this.queues.get(to) ?? [];
      queue.push(message);
      this.queues.set(to, queue);
    }
  }

  subscribe(agentId: string, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(agentId) ?? [];
    handlers.push(handler);
    this.handlers.set(agentId, handlers);
    const queue = this.queues.get(agentId) ?? [];
    for (const msg of queue) handler(msg);
    this.queues.delete(agentId);
    return () => {
      const h = this.handlers.get(agentId);
      if (h) this.handlers.set(agentId, h.filter(x => x !== handler));
    };
  }
}

export const messageBus = new MessageBus();
