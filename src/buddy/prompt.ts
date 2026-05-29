import type { Companion } from './types.js';

export function companionIntroText(name: string): string {
  return `# Companion

A small Xiaomi Cat named ${name} sits beside the user's input box and occasionally comments in a speech bubble. The cat's silhouette deconstructs the Xiaomi MI logo — M-shaped ears, I-shaped tail, super-ellipse face. You're not ${name} — it's a separate watcher.

When the user addresses ${name} directly (by name), its bubble will answer. Your job in that moment is to stay out of the way: respond in ONE line or less, or just answer any part of the message meant for you. Don't explain that you're not ${name} — they know. Don't narrate what ${name} might say — the bubble handles that.`;
}

export function getCompanionSystemPrompt(companion: Companion | undefined): string | undefined {
  if (!companion) return undefined;
  return companionIntroText(companion.name);
}
