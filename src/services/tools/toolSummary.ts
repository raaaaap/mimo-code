const DEFAULT_MAX_LENGTH = 5000;
const DEFAULT_KEEP_CHARS = 500;

export function shouldSummarize(output: string, maxLength: number = DEFAULT_MAX_LENGTH): boolean {
  return output.length > maxLength;
}

export function truncateToolOutput(
  output: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
  keepChars: number = DEFAULT_KEEP_CHARS,
): string {
  if (output.length <= maxLength) return output;

  const head = output.slice(0, keepChars);
  const tail = output.slice(-keepChars);
  const omitted = output.length - keepChars * 2;

  return `${head}\n\n[...truncated ${omitted} chars...]\n\n${tail}`;
}

export function summarizeToolOutput(
  output: string,
  maxLength: number = DEFAULT_MAX_LENGTH,
  keepChars: number = DEFAULT_KEEP_CHARS,
): string {
  if (!shouldSummarize(output, maxLength)) return output;
  return truncateToolOutput(output, maxLength, keepChars);
}
