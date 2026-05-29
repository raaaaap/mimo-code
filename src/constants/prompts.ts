import type { Tool } from '../types/tool.js';
import type { SystemContext } from '../context.js';
import { formatSystemContext } from '../context.js';

export function getSystemPrompt(
  tools: Tool[],
  context: SystemContext,
  mimoMd?: string,
): string {
  const sections: string[] = [];

  sections.push(`You are Mimo, an AI coding agent running in the user's terminal. You help with software engineering tasks: writing code, debugging, refactoring, explaining code, and more.`);

  if (tools.length > 0) {
    sections.push(`## Available Tools\nYou have access to the following tools. Use them to help the user.`);
    for (const tool of tools) {
      sections.push(`### ${tool.name}\n${tool.prompt()}`);
    }
  }

  sections.push(`## System Context\n${formatSystemContext(context)}`);

  if (mimoMd) {
    sections.push(`## Project Configuration (MIMO.md)\n${mimoMd}`);
  }

  sections.push(`## Instructions
- Prefer editing existing files over creating new ones
- Be careful not to introduce security vulnerabilities
- When referencing files, use relative paths
- Run tests after making changes
- If unsure about requirements, ask the user`);

  return sections.join('\n\n');
}
