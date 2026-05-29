export interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const THEMES: Record<string, Theme> = {
  'mimo-dark': {
    name: 'mimo-dark',
    type: 'dark',
    colors: {
      background: '#1a1b2e',
      foreground: '#e0e0e0',
      primary: '#4a9eff',
      secondary: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'mimo-light': {
    name: 'mimo-light',
    type: 'light',
    colors: {
      background: '#ffffff',
      foreground: '#1f2937',
      primary: '#2563eb',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
  },
  'matrix': {
    name: 'matrix',
    type: 'dark',
    colors: {
      background: '#000000',
      foreground: '#00ff00',
      primary: '#00ff00',
      secondary: '#00cc00',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
    },
  },
  'ocean': {
    name: 'ocean',
    type: 'dark',
    colors: {
      background: '#0a1628',
      foreground: '#c9d1d9',
      primary: '#58a6ff',
      secondary: '#bc8cff',
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    },
  },
};

export function getTheme(name: string): Theme {
  return THEMES[name] ?? THEMES['mimo-dark'];
}
