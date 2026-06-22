// components/EmptyState/EmptyState.tsx
// Shown when the notes page has no valid video id. Illustration is pure CSS
// — no external assets — so it loads instantly and respects theme tokens.

import { Link } from "@tanstack/react-router";
import { Button } from "../Button/Button";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No video selected",
  description = "Paste a YouTube link on the home page to generate notes.",
}: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.art} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.play} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <Link to="/">
        <Button variant="primary">Go to home</Button>
      </Link>
    </div>
  );
}
