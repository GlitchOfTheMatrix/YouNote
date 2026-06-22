// providers/ThemeProvider.tsx
// Makes theme helpers available anywhere in the tree. ThemeToggle still
// updates the DOM directly for icon visibility, but other components can
// read `theme` here when they need to branch in JS.

import { createContext, useContext, type ReactNode } from "react";
import { useTheme } from "../hooks/useTheme";
import type { Theme } from "../lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns theme context; throws when used outside ThemeProvider. */
export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
