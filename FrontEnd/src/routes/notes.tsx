// routes/notes.tsx
// Results page. Search params (`url`, `mode`) are the source of truth.
// Three modes: Full (AI notes), Summary (AI summary), Transcript (raw text).
// TanStack Query caches by [url, mode] so toggling is instant after first fetch.

import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "../components/Header/Header";
import { NotesView } from "../components/NotesView/NotesView";
import { TranscriptView } from "../components/TranscriptView/TranscriptView";
import { ChatPanel } from "../components/ChatPanel/ChatPanel";
import { LoadingSkeleton } from "../components/LoadingSkeleton/LoadingSkeleton";
import { ErrorBox } from "../components/ErrorBox/ErrorBox";
import { EmptyState } from "../components/EmptyState/EmptyState";
import { Button } from "../components/Button/Button";
import { fetchNotes, fetchTranscript, type NotesMode } from "../lib/api";
import { downloadMarkdown, downloadText } from "../lib/download";
import { extractVideoId } from "../lib/youtube";
import {
  loadCachedNotes,
  saveCachedNotes,
  loadCachedTranscript,
  saveCachedTranscript,
} from "../lib/storage";
import { useClipboard } from "../hooks/useClipboard";
import styles from "./notes.module.css";

const searchSchema = z.object({
  url: z.string().catch(""),
  mode: z.enum(["full", "summary", "transcript"]).catch("full"),
});

export const Route = createFileRoute("/notes")({
  validateSearch: searchSchema,
  component: NotesPage,
});

function NotesPage() {
  const { url, mode } = Route.useSearch();
  const navigate = useNavigate();
  const videoId = extractVideoId(url);
  const { copied, copy } = useClipboard();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isHydrating = !mounted;

  const isTranscriptMode = mode === "transcript";
  const notesMode = isTranscriptMode ? undefined : (mode as "full" | "summary");

  // ---------------------------------------------------------------------------
  // Notes query — only active when mode is "full" or "summary"
  // ---------------------------------------------------------------------------
  const cachedNotes = notesMode ? loadCachedNotes(videoId, notesMode) : null;

  const notesQuery = useQuery({
    queryKey: ["notes", url, notesMode],
    queryFn: async () => {
      const result = await fetchNotes(url, notesMode!, videoId);
      if (videoId) saveCachedNotes(videoId, notesMode!, result);
      return result;
    },
    enabled: Boolean(videoId) && !isTranscriptMode,
    retry: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    initialData: cachedNotes ?? undefined,
  });

  // ---------------------------------------------------------------------------
  // Transcript query — only active when mode is "transcript"
  // ---------------------------------------------------------------------------
  const cachedTranscript = loadCachedTranscript(videoId);

  const transcriptQuery = useQuery({
    queryKey: ["transcript", url],
    queryFn: async () => {
      const result = await fetchTranscript(url, videoId);
      if (videoId) saveCachedTranscript(videoId, result);
      return result;
    },
    enabled: Boolean(videoId) && isTranscriptMode,
    retry: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    initialData: cachedTranscript ?? undefined,
  });

  // Unified loading / error / data refs for the active mode
  const activeQuery = isTranscriptMode ? transcriptQuery : notesQuery;
  const { isLoading, isError, error, isFetching, refetch } = activeQuery;

  function setMode(next: NotesMode) {
    if (next === mode) return;
    navigate({ to: "/notes", search: { url, mode: next } });
  }

  function handleRegenerate() {
    refetch();
  }

  function handleDownload() {
    if (!videoId) return;
    if (isTranscriptMode) {
      if (!transcriptQuery.data) return;
      downloadText(transcriptQuery.data.transcript, `${videoId}-transcript`);
    } else {
      if (!notesQuery.data) return;
      downloadMarkdown(notesQuery.data.notes, `${videoId}-${mode}`);
    }
  }

  function handleCopy() {
    if (isTranscriptMode) {
      if (transcriptQuery.data) copy(transcriptQuery.data.transcript);
    } else {
      if (notesQuery.data) copy(notesQuery.data.notes);
    }
  }

  const hasData = !isHydrating && (isTranscriptMode ? Boolean(transcriptQuery.data) : Boolean(notesQuery.data));

  if (!videoId) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <EmptyState
            title="Invalid YouTube link"
            description="The URL in the address bar doesn't look like a YouTube video. Head back and paste a valid link."
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Link to="/" className={styles.back}>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          New video
        </Link>

        <div className={styles.split}>
          <div className={styles.player}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className={styles.card}>
            <div className={styles.toolbar}>
              <div className={styles.tabs} role="tablist" aria-label="Notes mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "full"}
                  className={mode === "full" ? styles.tabActive : styles.tab}
                  onClick={() => setMode("full")}
                >
                  Full
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "summary"}
                  className={mode === "summary" ? styles.tabActive : styles.tab}
                  onClick={() => setMode("summary")}
                >
                  Summary
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "transcript"}
                  className={mode === "transcript" ? styles.tabActive : styles.tab}
                  onClick={() => setMode("transcript")}
                >
                  Transcript
                </button>
              </div>

              {hasData && (
                <div className={styles.toolbarActions}>
                  <button type="button" className={styles.actionBtn} onClick={handleCopy}>
                    {copied ? "Copied" : isTranscriptMode ? "Copy Transcript" : "Copy"}
                  </button>
                  <button type="button" className={styles.actionBtn} onClick={handleDownload}>
                    {isTranscriptMode ? "Download .txt" : "Download .md"}
                  </button>
                  {/* Regenerate only for AI-generated modes, not transcript */}
                  {!isTranscriptMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={styles.regenBtn}
                      onClick={handleRegenerate}
                      disabled={isFetching}
                    >
                      Regenerate
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className={styles.cardBody} aria-busy={isHydrating || isLoading || isFetching}>
              {isHydrating || isLoading || isFetching ? (
                <LoadingSkeleton />
              ) : isError ? (
                <ErrorBox
                  message={error instanceof Error ? error.message : "Something went wrong."}
                  onRetry={() => refetch()}
                />
              ) : isTranscriptMode && transcriptQuery.data ? (
                <TranscriptView transcript={transcriptQuery.data.transcript} />
              ) : !isTranscriptMode && notesQuery.data ? (
                <NotesView markdown={notesQuery.data.notes} />
              ) : null}
            </div>
          </div>
        </div>

        {/* Chat panel — uses notes from the AI query as context, not the raw transcript */}
        <ChatPanel videoId={videoId} notes={notesQuery.data?.notes ?? null} />
      </main>
    </div>
  );
}
