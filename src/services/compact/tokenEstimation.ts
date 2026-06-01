export function roughTokenCount(text: string): number {
  // ~4 chars per token for English, ~2 chars per token for CJK
  const cjkChars = (text.match(/[一-鿿぀-ゟ゠-ヿ]/g) || []).length;
  const otherChars = text.length - cjkChars;
  return Math.ceil(otherChars / 4 + cjkChars / 2);
}

export function roughTokenCountForMessages(messages: Array<{ role: string; content: string | unknown }>): number {
  let total = 0;
  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    total += roughTokenCount(content);
    total += 4; // overhead per message
  }
  return total;
}

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'mimo-v2.5-pro': { input: 1.0, output: 3.0 },
    'mimo-v2.5': { input: 0.4, output: 2.0 },
    'gpt-4o': { input: 2.5, output: 10.0 },
  };

  const rates = pricing[model] ?? pricing['mimo-v2.5'];
  return (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}
