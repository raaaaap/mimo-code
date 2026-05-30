import { useAppState } from '../state/AppState.js';
import { selectTheme } from '../state/selectors.js';
import { getTheme, type Theme } from './themes.js';

export function useTheme(): Theme {
  const themeName = useAppState(selectTheme);
  return getTheme(themeName);
}
