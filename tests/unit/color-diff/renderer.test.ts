import { describe, it, expect, beforeAll } from 'vitest';
import stripAnsi from 'strip-ansi';

// Dynamically import the module after setting FORCE_COLOR so chalk
// initializes with color support in the non-TTY test environment.
let parseDiff: typeof import('../../../src/native-ts/color-diff/index.js').parseDiff;
let renderDiff: typeof import('../../../src/native-ts/color-diff/index.js').renderDiff;

beforeAll(async () => {
  process.env.FORCE_COLOR = '1';
  const mod = await import('../../../src/native-ts/color-diff/index.js');
  parseDiff = mod.parseDiff;
  renderDiff = mod.renderDiff;
});

const sampleDiff = [
  '@@ -1,3 +1,4 @@',
  ' unchanged',
  '-removed',
  '+added',
  '+another added',
  ' still here',
].join('\n');

describe('parseDiff', () => {
  it('parses header lines', () => {
    const lines = parseDiff('@@ -1,3 +1,4 @@');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('header');
    expect(lines[0].content).toBe('@@ -1,3 +1,4 @@');
  });

  it('parses add lines', () => {
    const lines = parseDiff('+hello');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('add');
    expect(lines[0].content).toBe('hello');
    expect(lines[0].raw).toBe('+hello');
  });

  it('parses remove lines', () => {
    const lines = parseDiff('-goodbye');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('remove');
    expect(lines[0].content).toBe('goodbye');
    expect(lines[0].raw).toBe('-goodbye');
  });

  it('parses context lines', () => {
    const lines = parseDiff(' unchanged');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('context');
    expect(lines[0].content).toBe('unchanged');
    expect(lines[0].raw).toBe(' unchanged');
  });

  it('parses a complete diff with all line types', () => {
    const lines = parseDiff(sampleDiff);
    expect(lines).toHaveLength(6);
    expect(lines.map((l) => l.type)).toEqual([
      'header',
      'context',
      'remove',
      'add',
      'add',
      'context',
    ]);
  });

  it('handles empty input', () => {
    const lines = parseDiff('');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('context');
    expect(lines[0].content).toBe('');
  });
});

describe('renderDiff', () => {
  it('renders add lines with color (differs from plain text)', () => {
    const output = renderDiff('+added line');
    const stripped = stripAnsi(output);
    expect(stripped).toBe('+added line');
    // When FORCE_COLOR is set, chalk wraps output with ANSI codes
    expect(output).not.toBe('+added line');
  });

  it('renders remove lines with color (differs from plain text)', () => {
    const output = renderDiff('-removed line');
    const stripped = stripAnsi(output);
    expect(stripped).toBe('-removed line');
    expect(output).not.toBe('-removed line');
  });

  it('renders header lines with color (differs from plain text)', () => {
    const output = renderDiff('@@ -1,1 +1,1 @@');
    const stripped = stripAnsi(output);
    expect(stripped).toBe('@@ -1,1 +1,1 @@');
    expect(output).not.toBe('@@ -1,1 +1,1 @@');
  });

  it('renders context lines without color codes', () => {
    const output = renderDiff(' context line');
    // context lines should not have color escape sequences
    expect(stripAnsi(output)).toBe(output);
  });

  it('renders a full diff preserving structure', () => {
    const output = renderDiff(sampleDiff);
    const stripped = stripAnsi(output);
    const resultLines = stripped.split('\n');
    expect(resultLines).toHaveLength(6);
    expect(resultLines[0]).toBe('@@ -1,3 +1,4 @@');
    expect(resultLines[1]).toBe(' unchanged');
    expect(resultLines[2]).toBe('-removed');
    expect(resultLines[3]).toBe('+added');
    expect(resultLines[4]).toBe('+another added');
    expect(resultLines[5]).toBe(' still here');
  });

  it('applies different styling to add vs remove lines', () => {
    const addOutput = renderDiff('+added');
    const removeOutput = renderDiff('-removed');
    // The ANSI-wrapped outputs should differ, proving different colors
    expect(addOutput).not.toBe(removeOutput);
  });
});
