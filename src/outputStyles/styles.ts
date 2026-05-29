export type OutputStyle = 'text' | 'json' | 'markdown';

export function formatOutput(data: unknown, style: OutputStyle): string {
  switch (style) {
    case 'json': return JSON.stringify(data, null, 2);
    case 'markdown': return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    case 'text': return typeof data === 'string' ? data : String(data);
  }
}
