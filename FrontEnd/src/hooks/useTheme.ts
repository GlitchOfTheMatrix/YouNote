// hooks/useTheme.ts
// React-facing theme API. DOM updates still go through lib/theme so the
// inline boot script, ThemeToggle, and this hook all stay in sync.

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  readCurrentTheme,
  toggleTheme,
  type Theme,
} from "../lib/theme";

/**
 * Exposes the active theme and helpers to change it.
 * Initial render uses "light" for SSR parity; an effect syncs on mount.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Inline boot script in __root.tsx already set data-theme; just sync state.
    setThemeState(readCurrentTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState(toggleTheme());
  }, []);

  return { theme, setTheme, toggle };
}
