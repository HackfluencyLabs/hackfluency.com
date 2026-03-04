/**
 * Hackfluency Theme Provider
 * ===========================
 * React context that manages theme state and exposes it to all React islands.
 * This is the single authority for theme state in React-land.
 * 
 * Usage:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 * 
 *   const { theme, themeId, setThemeId, themes } = useTheme();
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import {
  THEMES,
  THEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  getThemeById,
  applyThemeToDocument,
  getPersistedThemeId,
  type ThemeConfig,
} from './themes';

interface ThemeContextValue {
  /** Current active theme configuration */
  theme: ThemeConfig;
  /** Current theme ID string */
  themeId: string;
  /** Set a new theme by ID (persists automatically) */
  setThemeId: (id: string) => void;
  /** All available themes */
  themes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /** Optional initial theme ID (overrides localStorage) */
  initialThemeId?: string;
}

export function ThemeProvider({ children, initialThemeId }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    // Priority: prop > localStorage > default
    if (initialThemeId) return initialThemeId;
    return getPersistedThemeId();
  });

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    applyThemeToDocument(id);
  }, []);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyThemeToDocument(themeId);
  }, [themeId]);

  // Listen for theme changes from other tabs/windows
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setThemeIdState(e.newValue);
        applyThemeToDocument(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeId, setThemeId, themes: THEMES }),
    [theme, themeId, setThemeId]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme context.
 * Works both inside and outside ThemeProvider (standalone React islands).
 * When used outside ThemeProvider, subscribes to the 'hf-theme-change' window
 * event dispatched by applyThemeToDocument so it stays reactive.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  // Fallback state — only meaningful when ctx is null (standalone island)
  const [fallbackThemeId, setFallbackThemeId] = useState<string>(
    () => (ctx ? '' : getPersistedThemeId())
  );

  // Subscribe to cross-island theme-change events when outside ThemeProvider
  useEffect(() => {
    if (ctx) return; // ThemeProvider handles its own state
    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ themeId: string }>).detail?.themeId;
      if (id) setFallbackThemeId(id);
    };
    window.addEventListener('hf-theme-change', handler);
    return () => window.removeEventListener('hf-theme-change', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — re-registers only on unmount/remount

  if (ctx) return ctx;

  // Standalone fallback
  const theme = getThemeById(fallbackThemeId);
  return {
    theme,
    themeId: fallbackThemeId,
    setThemeId: (id: string) => applyThemeToDocument(id),
    themes: THEMES,
  };
}
