// components/ErrorBox/ErrorBox.tsx
// Friendly inline error card with an optional retry action. Used on the
// notes page when generation fails.

import { Button } from "../Button/Button";
import styles from "./ErrorBox.module.css";

type ErrorBoxProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorBox({ message, onRetry, retryLabel = "Try again" }: ErrorBoxProps) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
