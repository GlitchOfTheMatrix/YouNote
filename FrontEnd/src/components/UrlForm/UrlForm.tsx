// components/UrlForm/UrlForm.tsx
// Landing-page entry point: validate a YouTube URL, pick a mode, navigate.
// Validation is optimistic — we only check URL shape here; generation errors
// surface on the notes page with a retry affordance.

import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { extractVideoId } from "../../lib/youtube";
import { Button } from "../Button/Button";
import styles from "./UrlForm.module.css";

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function go(mode: "full" | "summary" | "transcript") {
    const trimmed = url.trim();

    if (!trimmed) {
      setError("Paste a YouTube link to get started.");
      return;
    }

    if (!extractVideoId(trimmed)) {
      setError("That doesn't look like a valid YouTube URL.");
      return;
    }

    setError(null);
    navigate({ to: "/notes", search: { url: trimmed, mode } });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    go("full");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.inputWrap}>
        <svg
          className={styles.inputIcon}
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
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
        </svg>
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste a YouTube link…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          aria-label="YouTube video URL"
          aria-invalid={error ? true : undefined}
          className={styles.input}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" className={styles.actionFull}>
          Full Notes
        </Button>
        <Button type="button" variant="secondary" className={styles.actionFull} onClick={() => go("summary")}>
          Summarize
        </Button>
        <Button type="button" variant="ghost" className={styles.actionFull} onClick={() => go("transcript")}>
          Transcript
        </Button>
      </div>
    </form>
  );
}
