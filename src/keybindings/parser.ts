import { Keybinding, ParsedKey } from './types';

/**
 * Parse a key combo string like "ctrl+c", "ctrl+shift+k", "escape" into
 * a structured ParsedKey object.
 */
export function parseKeyCombo(combo: string): ParsedKey {
  const parts = combo.toLowerCase().split('+');
  const parsed: ParsedKey = { key: '' };

  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        parsed.ctrl = true;
        break;
      case 'alt':
      case 'option':
        parsed.alt = true;
        break;
      case 'shift':
        parsed.shift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'super':
        parsed.meta = true;
        break;
      default:
        parsed.key = part;
    }
  }

  return parsed;
}

/**
 * Given a raw input string (e.g. the key name from a keypress event) and a
 * list of keybindings, return the first matching binding or null.
 *
 * The input string is expected to be in the form "ctrl+c", "escape", etc.
 * Matching compares the normalised parsed forms so that ordering of
 * modifiers does not matter.
 */
export function matchKeybinding(
  input: string,
  bindings: Keybinding[],
): Keybinding | null {
  const parsed = parseKeyCombo(input);

  for (const binding of bindings) {
    const target = parseKeyCombo(binding.key);

    if (
      parsed.key === target.key &&
      !!parsed.ctrl === !!target.ctrl &&
      !!parsed.alt === !!target.alt &&
      !!parsed.shift === !!target.shift &&
      !!parsed.meta === !!target.meta
    ) {
      return binding;
    }
  }

  return null;
}
