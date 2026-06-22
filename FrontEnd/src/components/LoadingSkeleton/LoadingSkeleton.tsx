// components/LoadingSkeleton/LoadingSkeleton.tsx
// Shimmer placeholder shown while notes are generating. Extracted from the
// notes route so the loading state can be reused or tested in isolation.

import styles from "./LoadingSkeleton.module.css";

const LINE_WIDTHS = ["55%", "92%", "88%", "70%", "84%"];

export function LoadingSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {LINE_WIDTHS.map((width) => (
        <div key={width} className={styles.line} style={{ width }} />
      ))}
    </div>
  );
}
