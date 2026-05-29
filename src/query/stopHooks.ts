import type { HookRegistry } from '../hooks/registry.js';
import type { Message } from '../types/message.js';

export async function executeStopHooks(
  hooks: HookRegistry,
  messages: Message[],
  turnCount: number,
): Promise<void> {
  await hooks.execute('SessionEnd', {
    messageCount: messages.length,
    turnCount,
    lastMessage: typeof messages[messages.length - 1]?.content === 'string'
      ? messages[messages.length - 1]!.content
      : '',
  });
}
