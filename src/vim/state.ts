import type { VimState } from "./types";

export function createVimState(): VimState {
  return { mode: "normal", sub: "idle", cursor: 0, line: "" };
}

export function processVimKey(state: VimState, key: string, line: string): VimState {
  // work on a shallow copy
  const next: VimState = { ...state, line };

  if (next.mode === "insert") {
    return processInsert(next, key);
  }
  return processNormal(next, key);
}

function processInsert(s: VimState, key: string): VimState {
  if (key === "Escape") {
    // move cursor back one if possible (vim convention: leave insert mode one char left)
    return { ...s, mode: "normal", cursor: Math.max(0, s.cursor - 1) };
  }

  // regular character — insert at cursor
  const before = s.line.slice(0, s.cursor);
  const after = s.line.slice(s.cursor);
  return { ...s, line: before + key + after, cursor: s.cursor + 1 };
}

function processNormal(s: VimState, key: string): VimState {
  const len = s.line.length;

  switch (key) {
    case "i": // enter insert before cursor
      return { ...s, mode: "insert" };

    case "a": // enter insert after cursor
      return { ...s, mode: "insert", cursor: Math.min(len, s.cursor + 1) };

    case "h": // move left
      return { ...s, cursor: Math.max(0, s.cursor - 1) };

    case "l": // move right
      return { ...s, cursor: Math.min(Math.max(0, len - 1), s.cursor + 1) };

    case "0": // jump to start
      return { ...s, cursor: 0 };

    case "$": // jump to end
      return { ...s, cursor: Math.max(0, len - 1) };

    case "x": // delete char under cursor
      if (len === 0) return s;
      {
        const newLine = s.line.slice(0, s.cursor) + s.line.slice(s.cursor + 1);
        return { ...s, line: newLine, cursor: Math.min(s.cursor, Math.max(0, newLine.length - 1)) };
      }

    default:
      return s;
  }
}
