import React from 'react';
import { Text } from 'ink';
import chalk from 'chalk';

interface Props {
  code: string;
  language?: string;
}

const KEYWORDS: Record<string, string[]> = {
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'interface', 'type', 'async', 'await', 'new', 'this'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'lambda', 'yield'],
};

function highlightLine(line: string, language?: string): string {
  const keywords = KEYWORDS[language ?? ''] ?? [];

  // Comments
  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) {
    return chalk.gray(line);
  }

  // Strings
  let result = line.replace(/(["'`])((?:(?!\1)[\s\S])*?)\1/g, chalk.yellow('$1$2$1'));

  // Keywords
  for (const kw of keywords) {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), chalk.blue(kw));
  }

  // Numbers
  result = result.replace(/\b(\d+)\b/g, chalk.cyan('$1'));

  return result;
}

export function HighlightedCode({ code, language }: Props) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i}>{highlightLine(line, language)}</Text>
      ))}
    </>
  );
}
