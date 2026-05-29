import { Keybinding } from './types';

export const defaultKeybindings: Keybinding[] = [
  { key: 'ctrl+c', action: 'interrupt' },
  { key: 'ctrl+d', action: 'exit' },
  { key: 'ctrl+l', action: 'clear' },
  { key: 'ctrl+k', action: 'clear_input' },
  { key: 'ctrl+r', action: 'history_search' },
  { key: 'escape', action: 'cancel' },
];
