import { createContext, useContext, type ReactNode } from 'react';
import { font, palette, radii, spacing, typography } from './tokens';

const theme = { palette, spacing, radii, typography, font };
export type Theme = typeof theme;

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
