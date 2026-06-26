import { useState } from "react";
import { useExtensionStatus } from "../../hooks/useExtensionStatus";
import styles from "./ExtensionBanner.module.css";

export function ExtensionBanner() {
  const available = useExtensionStatus();
  const [dismissed, setDismissed] = useState(false);

  // If loading (null), available (true), or user dismissed it, hide banner.
  if (available !== false || dismissed) return null;

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.text}>
        <strong>Tip:</strong> Load the YouNote browser extension to fetch transcripts reliably without being blocked by YouTube.
      </p>
      <button 
        className={styles.dismiss} 
        onClick={() => setDismissed(true)} 
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
