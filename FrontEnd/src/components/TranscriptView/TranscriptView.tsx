// components/TranscriptView/TranscriptView.tsx
// Displays the raw YouTube transcript with search, word count, and reading time.
// Search is client-side only — highlights matches inline using <mark> elements.

import { useMemo, useState, type ChangeEvent } from "react";
import styles from "./TranscriptView.module.css";

type TranscriptViewProps = {
  transcript: string;
};

/** Average adult reading speed in words per minute. */
const WPM = 200;

/**
 * Splits transcript text into alternating [non-match, match, non-match, ...]
 * segments for a case-insensitive search query. Returns the full text as a
 * single segment when query is empty.
 */
function splitByQuery(text: string, query: string): string[] {
  if (!query) return [text];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  return text.split(re);
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const [search, setSearch] = useState("");

  const wordCount = useMemo(() => {
    const words = transcript.trim().split(/\s+/);
    return words.length;
  }, [transcript]);

  const readingTime = useMemo(() => {
    const mins = Math.ceil(wordCount / WPM);
    return mins < 1 ? "< 1 min read" : `${mins} min read`;
  }, [wordCount]);

  // Split transcript into segments; odd indices are matches.
  const segments = useMemo(() => splitByQuery(transcript, search.trim()), [transcript, search]);

  const matchCount = useMemo(() => {
    if (!search.trim()) return 0;
    return segments.filter((_, i) => i % 2 === 1).length;
  }, [segments, search]);

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  return (
    <div className={styles.wrap}>
      {/* Stats bar — word count + reading time */}
      <div className={styles.stats}>
        <span className={styles.stat}>{wordCount.toLocaleString()} words</span>
        <span className={styles.statDot}>·</span>
        <span className={styles.stat}>{readingTime}</span>
      </div>

      {/* Search input */}
      <div className={styles.searchRow}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search transcript…"
          value={search}
          onChange={handleSearchChange}
          aria-label="Search transcript"
        />
        {search.trim() && (
          <span className={styles.matchCount}>
            {matchCount} {matchCount === 1 ? "match" : "matches"}
          </span>
        )}
      </div>

      {/* Transcript text with highlighted matches */}
      <div className={styles.text}>
        {segments.map((segment, i) =>
          i % 2 === 1 ? (
            <mark key={i} className={styles.highlight}>
              {segment}
            </mark>
          ) : (
            <span key={i}>{segment}</span>
          )
        )}
      </div>
    </div>
  );
}
