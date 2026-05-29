import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSkillsFromDir } from '../../../src/skills/loader.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

describe('loadSkillsFromDir', () => {
  it('returns empty array for non-existent directory', async () => {
    const skills = await loadSkillsFromDir('/definitely/does/not/exist');
    expect(skills).toEqual([]);
  });

  it('loads skills from .md files with frontmatter', async () => {
    const skills = await loadSkillsFromDir(fixturesDir);
    expect(skills.length).toBeGreaterThanOrEqual(2);

    const greet = skills.find((s) => s.name === 'greet');
    expect(greet).toBeDefined();
    expect(greet!.description).toBe('Greet the user warmly');
    expect(greet!.aliases).toEqual(['hello', 'hi']);
  });

  it('skips .md files without required frontmatter fields', async () => {
    const skills = await loadSkillsFromDir(fixturesDir);
    const bad = skills.find((s) => s.name === undefined);
    expect(bad).toBeUndefined();
  });

  it('parses aliases from comma-separated frontmatter', async () => {
    const skills = await loadSkillsFromDir(fixturesDir);
    const greet = skills.find((s) => s.name === 'greet');
    expect(greet!.aliases).toEqual(['hello', 'hi']);
  });

  it('parses allowedTools from comma-separated frontmatter', async () => {
    const skills = await loadSkillsFromDir(fixturesDir);
    const explain = skills.find((s) => s.name === 'explain');
    expect(explain).toBeDefined();
    expect(explain!.allowedTools).toEqual(['WebSearch']);
  });

  it('substitutes {{args}} in getPromptForCommand', async () => {
    const skills = await loadSkillsFromDir(fixturesDir);
    const greet = skills.find((s) => s.name === 'greet');
    const prompt = greet!.getPromptForCommand('Alice');
    expect(prompt).toContain('Alice');
    expect(prompt).not.toContain('{{args}}');
  });

  it('returns empty array for empty directory', async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const dir = await mkdtemp(join(tmpdir(), 'skills-test-'));
    const skills = await loadSkillsFromDir(dir);
    expect(skills).toEqual([]);
  });
});

describe('built-in skills', () => {
  it('remember skill returns a prompt containing the args', async () => {
    const { createRememberSkill } = await import('../../../src/skills/builtin/remember.js');
    const skill = createRememberSkill();
    expect(skill.name).toBe('remember');
    expect(skill.aliases).toContain('rem');
    const prompt = skill.getPromptForCommand('I prefer dark mode');
    expect(prompt).toContain('I prefer dark mode');
  });

  it('simplify skill returns a prompt containing the args', async () => {
    const { createSimplifySkill } = await import('../../../src/skills/builtin/simplify.js');
    const skill = createSimplifySkill();
    expect(skill.name).toBe('simplify');
    expect(skill.aliases).toContain('refactor');
    const prompt = skill.getPromptForCommand('src/utils/parser.ts');
    expect(prompt).toContain('src/utils/parser.ts');
  });
});
