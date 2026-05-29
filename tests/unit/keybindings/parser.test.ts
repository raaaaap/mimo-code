import { describe, it, expect } from 'vitest';
import { parseKeyCombo, matchKeybinding } from '../../../src/keybindings/parser';
import { defaultKeybindings } from '../../../src/keybindings/defaults';
import { Keybinding } from '../../../src/keybindings/types';

describe('parseKeyCombo', () => {
  it('parses a simple key', () => {
    expect(parseKeyCombo('escape')).toEqual({ key: 'escape' });
  });

  it('parses ctrl+c', () => {
    expect(parseKeyCombo('ctrl+c')).toEqual({ ctrl: true, key: 'c' });
  });

  it('parses ctrl+shift+k', () => {
    expect(parseKeyCombo('ctrl+shift+k')).toEqual({
      ctrl: true,
      shift: true,
      key: 'k',
    });
  });

  it('parses alt+x', () => {
    expect(parseKeyCombo('alt+x')).toEqual({ alt: true, key: 'x' });
  });

  it('parses meta+shift+a (cmd)', () => {
    expect(parseKeyCombo('cmd+shift+a')).toEqual({
      meta: true,
      shift: true,
      key: 'a',
    });
  });

  it('normalises "control" to ctrl', () => {
    expect(parseKeyCombo('control+c')).toEqual({ ctrl: true, key: 'c' });
  });

  it('is case-insensitive', () => {
    expect(parseKeyCombo('CTRL+C')).toEqual({ ctrl: true, key: 'c' });
  });
});

describe('matchKeybinding', () => {
  const bindings: Keybinding[] = [
    { key: 'ctrl+c', action: 'interrupt' },
    { key: 'ctrl+d', action: 'exit' },
    { key: 'escape', action: 'cancel' },
    { key: 'ctrl+shift+k', action: 'clear_input' },
  ];

  it('matches ctrl+c to interrupt', () => {
    expect(matchKeybinding('ctrl+c', bindings)?.action).toBe('interrupt');
  });

  it('matches ctrl+d to exit', () => {
    expect(matchKeybinding('ctrl+d', bindings)?.action).toBe('exit');
  });

  it('matches escape to cancel', () => {
    expect(matchKeybinding('escape', bindings)?.action).toBe('cancel');
  });

  it('matches ctrl+shift+k to clear_input', () => {
    expect(matchKeybinding('ctrl+shift+k', bindings)?.action).toBe('clear_input');
  });

  it('returns null for unmatched input', () => {
    expect(matchKeybinding('ctrl+z', bindings)).toBeNull();
  });

  it('does not care about modifier order', () => {
    expect(matchKeybinding('shift+ctrl+k', bindings)?.action).toBe('clear_input');
  });

  it('returns null for empty bindings list', () => {
    expect(matchKeybinding('ctrl+c', [])).toBeNull();
  });
});

describe('defaultKeybindings', () => {
  it('contains the expected bindings', () => {
    expect(defaultKeybindings).toHaveLength(6);
    expect(defaultKeybindings.map((b) => b.action)).toEqual([
      'interrupt',
      'exit',
      'clear',
      'clear_input',
      'history_search',
      'cancel',
    ]);
  });
});
