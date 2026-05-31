import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import type { Message } from '../../types/message.js';
import { useTheme } from '../../utils/useTheme.js';

/** Simple markdown renderer for terminal display */
function renderMarkdown(text: string, theme: any): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      result.push(React.createElement(Text, { key: `br-${i}` }, ''));
      continue;
    }

    // Headers: ## text -> bold text
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      result.push(
        React.createElement(Text, { key: `h-${i}`, bold: true, color: theme.colors.primary }, headerMatch[2])
      );
      continue;
    }

    // Table rows: | col1 | col2 | -> formatted columns
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // Skip separator lines like |---|---|
      if (/^\|[\s-:|]+\|$/.test(line.trim())) continue;

      const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
      const formatted = cells.map((cell, j) => {
        // Bold text within cells
        const parts = cell.split(/(\*\*[^*]+\*\*)/);
        return parts.map((part, k) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return part.slice(2, -2);
          }
          return part;
        }).join('');
      });
      result.push(
        React.createElement(Text, { key: `tr-${i}`, color: theme.colors.foreground }, '  ' + formatted.join('  |  '))
      );
      continue;
    }

    // Regular line with inline formatting
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
    const inlineNodes = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return React.createElement(Text, { key: `b-${j}`, bold: true }, part.slice(2, -2));
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return React.createElement(Text, { key: `c-${j}`, color: theme.colors.accent }, part.slice(1, -1));
      }
      return part;
    });
    result.push(
      React.createElement(Text, { key: `line-${i}`, color: theme.colors.foreground }, ...inlineNodes)
    );
  }

  return result;
}

/** Strip tool call blocks (XML and JSON) from text content */
function stripToolCallXml(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .replace(/\{"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/g, '')
    .replace(/\{"tool"\s*:\s*"[^"]+"\s*,\s*"input"\s*:\s*\{[\s\S]*?\}\s*\}/g, '')
    .replace(/<function_calls>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g, '')
    .replace(/<parameter=[^>]*>[\s\S]*?<\/parameter>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse tool call names from text content (XML and JSON formats) */
function parseToolCallNames(text: string): string[] {
  const names: string[] = [];
  // XML format
  const xmlRegex = /<tool_call>\s*<function=(\w+)>/g;
  let match;
  while ((match = xmlRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  // JSON format with "name" key
  const jsonRegex = /\{"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:/g;
  while ((match = jsonRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  // JSON format with "tool" key
  const altRegex = /\{"tool"\s*:\s*"([^"]+)"\s*,\s*"input"\s*:/g;
  while ((match = altRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  return names;
}

function ThinkingBlock({ thinking, theme }: { thinking: string; theme: any }) {
  const [expanded, setExpanded] = useState(false);

  useInput((key, input) => {
    if (input.return || key === ' ') {
      setExpanded((prev) => !prev);
    }
  });

  const lines = thinking.split('\n');
  const preview = lines[0]?.slice(0, 80) ?? '';
  const hasMore = lines.length > 1 || (lines[0]?.length ?? 0) > 80;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color={theme.colors.muted}>
        {expanded ? '▼' : '▶'} 💭 推理过程:{' '}
        {!expanded && (
          <Text color={theme.colors.muted} dimColor>
            {preview}{hasMore ? '...' : ''}
          </Text>
        )}
      </Text>
      {expanded && (
        <Box flexDirection="column" paddingLeft={2} marginTop={0}>
          {lines.map((line, i) => (
            <Text key={i} color={theme.colors.muted} dimColor>
              {line}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

export function MessageItem({ message }: { message: Message }) {
  const theme = useTheme();

  const roleColors: Record<string, string> = {
    user: theme.colors.accent,
    assistant: theme.colors.success,
    tool: theme.colors.warning,
    system: theme.colors.muted,
  };
  const roleLabels: Record<string, string> = {
    user: 'You',
    assistant: 'Mimo',
    tool: 'Result',
    system: 'System',
  };
  const color = roleColors[message.role] ?? theme.colors.foreground;
  const label = roleLabels[message.role] ?? message.role;

  // Extract text content
  const rawContent =
    typeof message.content === 'string'
      ? message.content
      : message.content.map((p) => p.text ?? '').join('');

  // Hide tool result messages entirely
  if (message.role === 'tool') {
    return null;
  }

  // For assistant messages, strip tool call blocks from display text
  const displayContent = message.role === 'assistant' ? stripToolCallXml(rawContent) : rawContent;

  // Collect tool names from both structured toolCalls and parsed text
  const toolNames: string[] = [];
  if (message.toolCalls) {
    for (const tc of message.toolCalls) {
      toolNames.push(tc.function.name);
    }
  }
  // Also parse tool calls from text if no structured ones
  if (toolNames.length === 0 && message.role === 'assistant') {
    toolNames.push(...parseToolCallNames(rawContent));
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={color}>
        [{label}]
      </Text>
      {message.thinking && <ThinkingBlock thinking={message.thinking} theme={theme} />}
      {displayContent && renderMarkdown(displayContent, theme)}
      {toolNames.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {toolNames.map((name, i) => (
            <Text key={i} color={theme.colors.accent}>
              {'  '}{name}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
