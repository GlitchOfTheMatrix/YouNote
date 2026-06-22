// lib/youtube.ts
// YouTube URL parsing used by the URL form (client-side validation) and
// the notes page (embed + cache keys). Keeping this separate from the API
// layer means URL rules can be tested and reused without touching mock data.

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function isValidId(id: string): boolean {
  return VIDEO_ID_RE.test(id);
}

/**
 * Pulls an 11-character video id from common YouTube URL shapes.
 * Returns null when the string is not a recognizable YouTube link.
 */
export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return isValidId(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && isValidId(id) ? id : null;
      }

      const parts = u.pathname.split("/").filter(Boolean);
      if ((parts[0] === "shorts" || parts[0] === "embed") && parts[1]) {
        return isValidId(parts[1]) ? parts[1] : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

