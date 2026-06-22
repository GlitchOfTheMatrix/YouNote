// components/ThemeToggle/ThemeToggle.tsx
// Light/dark switch. Icons are always in the DOM; CSS picks visibility from
// `data-theme` on <html> to avoid hydration mismatches. Click goes through
// ThemeProvider so any JS consumers stay in sync.

import { useThemeContext } from "../../providers/ThemeProvider";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  const { toggle } = useThemeContext();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
    >
      <svg
        className={styles.sun}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        className={styles.moon}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
      </svg>
    </button>
  );
}
