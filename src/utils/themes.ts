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
    muted: string;
    accent: string;
  };
}

export const THEMES: Record<string, Theme> = {
  'mimo-dark': {
    name: 'mimo-dark',
    type: 'dark',
    colors: {
      background: '#1a1b2e',
      foreground: '#e0e0e0',
      primary: '#FF6900',
      secondary: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      muted: '#6b7280',
      accent: '#FF6900',
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
      muted: '#9ca3af',
      accent: '#2563eb',
    },
  },
  'dracula': {
    name: 'dracula',
    type: 'dark',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      primary: '#bd93f9',
      secondary: '#ff79c6',
      success: '#50fa7b',
      warning: '#f1fa8c',
      error: '#ff5555',
      muted: '#6272a4',
      accent: '#8be9fd',
    },
  },
  'nord': {
    name: 'nord',
    type: 'dark',
    colors: {
      background: '#2e3440',
      foreground: '#eceff4',
      primary: '#88c0d0',
      secondary: '#b48ead',
      success: '#a3be8c',
      warning: '#ebcb8b',
      error: '#bf616a',
      muted: '#4c566a',
      accent: '#81a1c1',
    },
  },
  'catppuccin': {
    name: 'catppuccin',
    type: 'dark',
    colors: {
      background: '#1e1e2e',
      foreground: '#cdd6f4',
      primary: '#cba6f7',
      secondary: '#f5c2e7',
      success: '#a6e3a1',
      warning: '#f9e2af',
      error: '#f38ba8',
      muted: '#585b70',
      accent: '#89b4fa',
    },
  },
  'solarized-dark': {
    name: 'solarized-dark',
    type: 'dark',
    colors: {
      background: '#002b36',
      foreground: '#839496',
      primary: '#2aa198',
      secondary: '#6c71c4',
      success: '#859900',
      warning: '#b58900',
      error: '#dc322f',
      muted: '#586e75',
      accent: '#268bd2',
    },
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export function getTheme(name: string): Theme {
  return THEMES[name] ?? THEMES['mimo-dark'];
}
