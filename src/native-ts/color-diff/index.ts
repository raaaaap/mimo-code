import chalk from 'chalk';

export type DiffLineType = 'add' | 'remove' | 'context' | 'header';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  raw: string;
}

/**
 * Parse a unified diff string into structured DiffLine objects.
 */
export function parseDiff(text: string): DiffLine[] {
  const lines = text.split('\n');
  const result: DiffLine[] = [];

  for (const raw of lines) {
    let type: DiffLineType;
    let content: string;

    if (raw.startsWith('@@')) {
      type = 'header';
      content = raw;
    } else if (raw.startsWith('+')) {
      type = 'add';
      content = raw.slice(1);
    } else if (raw.startsWith('-')) {
      type = 'remove';
      content = raw.slice(1);
    } else {
      type = 'context';
      // Lines starting with a space have that leading space stripped for content
      content = raw.startsWith(' ') ? raw.slice(1) : raw;
    }

    result.push({ type, content, raw });
  }

  return result;
}

/**
 * Render a unified diff string with chalk colors.
 * - green for added lines
 * - red for removed lines
 * - cyan for @@ header lines
 * - default for context lines
 */
export function renderDiff(text: string): string {
  const lines = parseDiff(text);
  const rendered: string[] = [];

  for (const line of lines) {
    switch (line.type) {
      case 'add':
        rendered.push(chalk.green(line.raw));
        break;
      case 'remove':
        rendered.push(chalk.red(line.raw));
        break;
      case 'header':
        rendered.push(chalk.cyan(line.raw));
        break;
      case 'context':
        rendered.push(line.raw);
        break;
    }
  }

  return rendered.join('\n');
}
