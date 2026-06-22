// lib/api.ts
// Single entry point for all server-bound operations. UI imports from here
// only. All requests are routed to the FastAPI backend.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export type NotesMode = "full" | "summary" | "transcript";

/** Shape returned by POST /notes on the backend. */
interface NotesApiResponse {
  title: string;
  videoId: string;
  notes: string;
}

/** Shape returned by POST /transcript on the backend. */
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

/**
 * Fetches AI-generated notes for a YouTube URL.
 * Returns both the markdown notes and the video title from the backend.
 */
export async function fetchNotes(
  url: string,
  mode: "full" | "summary",
): Promise<NotesApiResponse> {
  return post<NotesApiResponse>("/notes", { url, mode }, "Failed to generate notes");
}

/**
 * Fetches the raw YouTube transcript without AI processing.
 */
export async function fetchTranscript(
  url: string,
): Promise<TranscriptApiResponse> {
  return post<TranscriptApiResponse>("/transcript", { url }, "Failed to fetch transcript");
}

/**
 * Sends a follow-up question about the current video transcript.
 * The backend requires the generated notes as context to ground its answer.
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
