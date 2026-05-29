export interface Keybinding {
  key: string;
  action: string;
  when?: string;
  platform?: 'win32' | 'darwin' | 'linux';
}

export interface ParsedKey {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string;
}
