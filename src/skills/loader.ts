import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Skill } from './types.js';

/**
 * Parse YAML-style frontmatter delimited by `---`.
 * Returns { frontmatter, body } where frontmatter is a plain object.
 * Does NOT use a YAML library — just splits key: value lines.
 */
function parseFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
  const trimmed = raw.replace(/^﻿/, ''); // strip BOM
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: trimmed };
  }

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) frontmatter[key] = value;
  }

  return { frontmatter, body: match[2] };
}

/**
 * Build a Skill from parsed frontmatter and body text.
 */
function skillFromFrontmatter(fm: Record<string, string>, body: string): Skill | null {
  const name = fm.name;
  const description = fm.description;
  if (!name || !description) return null;

  const aliases = fm.aliases
    ? fm.aliases.split(',').map((a) => a.trim()).filter(Boolean)
    : undefined;

  const allowedTools = fm.allowedTools
    ? fm.allowedTools.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined;

  const promptBody = body.trim();

  const skill: Skill = {
    name,
    description,
    getPromptForCommand(args: string): string {
      return promptBody.replace(/\{\{args\}\}/g, args);
    },
  };

  if (aliases && aliases.length > 0) skill.aliases = aliases;
  if (allowedTools && allowedTools.length > 0) skill.allowedTools = allowedTools;

  return skill;
}

/**
 * Load all `.md` skill files from a directory.
 * Each file must have YAML frontmatter with at least `name` and `description`.
 * Returns an empty array if the directory does not exist.
 */
export async function loadSkillsFromDir(dir: string): Promise<Skill[]> {
  let entries: string[];
  try {
    await stat(dir);
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const mdFiles = entries.filter((e) => e.endsWith('.md'));
  const skills: Skill[] = [];

  for (const file of mdFiles) {
    const raw = await readFile(join(dir, file), 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);
    const skill = skillFromFrontmatter(frontmatter, body);
    if (skill) skills.push(skill);
  }

  return skills;
}
