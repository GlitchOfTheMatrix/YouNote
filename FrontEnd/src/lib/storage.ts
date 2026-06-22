// lib/storage.ts
// localStorage helpers for per-video data (chat history + notes/transcript cache).
// Scoped by videoId so switching videos never leaks data into one another.

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const CHAT_KEY_PREFIX = "younote.chat.";
const NOTES_KEY_PREFIX = "younote.notes.";
const TRANSCRIPT_KEY_PREFIX = "younote.transcript.";

/** Generic helper to read from localStorage. */
function readJson<T>(key: string, validate: (parsed: T) => boolean): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Generic helper to write to localStorage. */
function writeJson<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Quota exceeded or private mode — data just won't persist.
  }
}

/** Generic helper to remove from localStorage. */
function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

// ---------------------------------------------------------------------------
// Chat History
// ---------------------------------------------------------------------------

export function loadChatHistory(videoId: string | null): ChatMessage[] {
  if (!videoId) return [];
  return readJson<ChatMessage[]>(CHAT_KEY_PREFIX + videoId, Array.isArray) ?? [];
}

export function saveChatHistory(videoId: string | null, messages: ChatMessage[]): void {
  if (videoId) writeJson(CHAT_KEY_PREFIX + videoId, messages);
}

export function clearChatHistory(videoId: string | null): void {
  if (videoId) removeKey(CHAT_KEY_PREFIX + videoId);
}

// ---------------------------------------------------------------------------
// Notes cache
// ---------------------------------------------------------------------------

export interface CachedNotes {
  title: string;
  videoId: string;
  notes: string;
}

function notesKey(videoId: string, mode: string): string {
  return `${NOTES_KEY_PREFIX}${videoId}.${mode}`;
}

export function loadCachedNotes(videoId: string | null, mode: string): CachedNotes | null {
  if (!videoId) return null;
  return readJson<CachedNotes>(notesKey(videoId, mode), (p) => Boolean(p?.notes));
}

export function saveCachedNotes(videoId: string, mode: string, data: CachedNotes): void {
  writeJson(notesKey(videoId, mode), data);
}

// ---------------------------------------------------------------------------
// Transcript cache
// ---------------------------------------------------------------------------

export interface CachedTranscript {
  title: string;
  videoId: string;
  transcript: string;
}

export function loadCachedTranscript(videoId: string | null): CachedTranscript | null {
  if (!videoId) return null;
  return readJson<CachedTranscript>(TRANSCRIPT_KEY_PREFIX + videoId, (p) => Boolean(p?.transcript));
}

export function saveCachedTranscript(videoId: string, data: CachedTranscript): void {
  writeJson(TRANSCRIPT_KEY_PREFIX + videoId, data);
}
