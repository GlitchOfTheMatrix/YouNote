// lib/api.ts
// Single entry point for all server-bound operations. UI imports from here
// only. All requests are routed to the FastAPI backend.
// When the browser extension is available, transcripts are fetched via the
// extension (client IP) and sent to the backend for LLM processing.

import { isExtensionAvailable, getTranscriptFromExtension } from "./extension";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type NotesMode = "full" | "summary" | "transcript";

/** Shape returned by POST /notes and POST /notes-from-extension on the backend. */
interface NotesApiResponse {
  title: string;
  videoId: string;
  notes: string;
}

/** Shape returned by POST /transcript and POST /transcript-from-extension on the backend. */
interface TranscriptApiResponse {
  title: string;
  videoId: string;
  transcript: string;
}

/** Shape returned by POST /chat on the backend. */
interface ChatApiResponse {
  answer: string;
}

/** Shared fetch helper for JSON POST requests. */
async function post<T>(path: string, body: unknown, errorMessage: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.detail || `${errorMessage} (status ${res.status})`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Extension-aware fetch functions (try extension first, fallback to server)
// ---------------------------------------------------------------------------

/**
 * Fetches AI-generated notes for a YouTube video.
 * Strategy:
 *   1. Try to fetch the transcript via the browser extension (client IP)
 *   2. Send the transcript to POST /notes-from-extension for LLM processing
 *   3. If extension is unavailable, fall back to POST /notes (server-side fetch)
 */
export async function fetchNotes(
  url: string,
  mode: "full" | "summary",
  videoId?: string | null,
): Promise<NotesApiResponse> {
  // Try extension-first approach
  if (videoId) {
    try {
      const extensionAvailable = await isExtensionAvailable();
      if (extensionAvailable) {
        const transcript = await getTranscriptFromExtension(videoId);
        return await post<NotesApiResponse>(
          "/notes-from-extension",
          { videoId, transcript, mode },
          "Failed to generate notes",
        );
      }
    } catch (extErr) {
      console.warn("Extension notes fetch failed, falling back to server:", extErr);
    }
  }

  // Fallback: server-side transcript fetch + LLM
  return post<NotesApiResponse>("/notes", { url, mode }, "Failed to generate notes");
}

/**
 * Fetches the raw YouTube transcript.
 * Strategy:
 *   1. Try to fetch the transcript via the browser extension (client IP)
 *   2. Send to POST /transcript-from-extension so the backend can add the title
 *   3. If extension is unavailable, fall back to POST /transcript (server-side fetch)
 */
export async function fetchTranscript(
  url: string,
  videoId?: string | null,
): Promise<TranscriptApiResponse> {
  // Try extension-first approach
  if (videoId) {
    try {
      const extensionAvailable = await isExtensionAvailable();
      if (extensionAvailable) {
        const transcript = await getTranscriptFromExtension(videoId);
        return await post<TranscriptApiResponse>(
          "/transcript-from-extension",
          { videoId, transcript },
          "Failed to fetch transcript",
        );
      }
    } catch (extErr) {
      console.warn("Extension transcript fetch failed, falling back to server:", extErr);
    }
  }

  // Fallback: server-side transcript fetch
  return post<TranscriptApiResponse>("/transcript", { url }, "Failed to fetch transcript");
}

/**
 * Sends a follow-up question about the current video transcript.
 * The backend requires the generated notes as context to ground its answer.
 * (No change needed — chat always goes to the backend.)
 */
export async function askQuestion(
  notes: string,
  question: string,
): Promise<string> {
  const data = await post<ChatApiResponse>(
    "/chat",
    { notes, question },
    "Failed to get an answer"
  );
  return data.answer;
}
