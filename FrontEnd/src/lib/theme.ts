// lib/theme.ts
// Shared theme constants and DOM helpers. The inline boot script in
// __root.tsx and ThemeToggle both call into here so the storage key and
// meta-color updates never drift apart.

export const THEME_STORAGE_KEY = "younote-theme";

export type Theme = "light" | "dark";

/** Browser chrome color shown in the mobile status bar. */
export const THEME_META_COLORS: Record<Theme, string> = {
  light: "#fafaf9",
  dark: "#121110",
};

/**
 * Reads a saved theme from localStorage.
 * Returns null when nothing valid is stored (first visit).
 */
export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Falls back to the OS preference when no saved choice exists yet. */
export function readSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies theme to <html> and keeps meta theme-color in sync. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing — theme just won't persist this session.
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_META_COLORS[theme]);
}

/** Current theme from the DOM (defaults to light when unset). */
export function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/** Flip light ↔ dark and return the new value. */
export function toggleTheme(): Theme {
  const next: Theme = readCurrentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
