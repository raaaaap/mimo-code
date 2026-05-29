export type VimMode = "insert" | "normal";

export type VimSubState = "idle" | "pending-operator";

export interface VimState {
  mode: VimMode;
  sub: VimSubState;
  cursor: number;
  line: string;
}
