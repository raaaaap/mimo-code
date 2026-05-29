import { describe, expect, it } from "vitest";
import { createVimState, processVimKey } from "../../../src/vim/state";
import type { VimState } from "../../../src/vim/types";

describe("createVimState", () => {
  it("starts in normal mode at cursor 0", () => {
    const s = createVimState();
    expect(s.mode).toBe("normal");
    expect(s.cursor).toBe(0);
    expect(s.line).toBe("");
  });
});

describe("insert mode", () => {
  it("i enters insert mode", () => {
    const s = createVimState();
    const n = processVimKey(s, "i", "");
    expect(n.mode).toBe("insert");
  });

  it("typing inserts characters at cursor", () => {
    let s = processVimKey(createVimState(), "i", "");
    s = processVimKey(s, "h", "");
    s = processVimKey(s, "i", "h");
    s = processVimKey(s, "j", "hi");
    expect(s.line).toBe("hij");
    expect(s.cursor).toBe(3);
  });

  it("Escape returns to normal mode, cursor moves back one", () => {
    let s = processVimKey(createVimState(), "i", "");
    s = processVimKey(s, "a", s.line);
    expect(s.line).toBe("a");
    s = processVimKey(s, "b", s.line);
    expect(s.line).toBe("ab");
    expect(s.cursor).toBe(2);
    s = processVimKey(s, "Escape", s.line);
    expect(s.mode).toBe("normal");
    expect(s.cursor).toBe(1);
  });

  it("Escape on empty line stays at cursor 0", () => {
    let s = processVimKey(createVimState(), "i", "");
    s = processVimKey(s, "Escape", "");
    expect(s.mode).toBe("normal");
    expect(s.cursor).toBe(0);
  });
});

describe("normal mode motions", () => {
  function normal(line: string, cursor: number): VimState {
    return { mode: "normal", sub: "idle", cursor, line };
  }

  it("h moves cursor left", () => {
    const n = processVimKey(normal("abc", 2), "h", "abc");
    expect(n.cursor).toBe(1);
  });

  it("h clamps at 0", () => {
    const n = processVimKey(normal("abc", 0), "h", "abc");
    expect(n.cursor).toBe(0);
  });

  it("l moves cursor right", () => {
    const n = processVimKey(normal("abc", 0), "l", "abc");
    expect(n.cursor).toBe(1);
  });

  it("l clamps at last char", () => {
    const n = processVimKey(normal("abc", 2), "l", "abc");
    expect(n.cursor).toBe(2);
  });

  it("0 jumps to start", () => {
    const n = processVimKey(normal("abc", 2), "0", "abc");
    expect(n.cursor).toBe(0);
  });

  it("$ jumps to end", () => {
    const n = processVimKey(normal("abc", 0), "$", "abc");
    expect(n.cursor).toBe(2);
  });

  it("x deletes character under cursor", () => {
    const n = processVimKey(normal("abc", 1), "x", "abc");
    expect(n.line).toBe("ac");
    expect(n.cursor).toBe(1);
  });

  it("x at end of line moves cursor back", () => {
    const n = processVimKey(normal("ab", 1), "x", "ab");
    expect(n.line).toBe("a");
    expect(n.cursor).toBe(0);
  });

  it("x on empty line is a no-op", () => {
    const n = processVimKey(normal("", 0), "x", "");
    expect(n.line).toBe("");
    expect(n.cursor).toBe(0);
  });

  it("a enters insert mode after cursor", () => {
    const n = processVimKey(normal("abc", 1), "a", "abc");
    expect(n.mode).toBe("insert");
    expect(n.cursor).toBe(2);
  });

  it("a at end stays at end", () => {
    const n = processVimKey(normal("abc", 2), "a", "abc");
    expect(n.mode).toBe("insert");
    expect(n.cursor).toBe(3);
  });

  it("unknown key is a no-op", () => {
    const n = processVimKey(normal("abc", 1), "z", "abc");
    expect(n).toEqual(normal("abc", 1));
  });
});
