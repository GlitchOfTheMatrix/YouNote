// lib/download.ts
// Triggers a browser download of text content. Kept out of the route so
// the notes page stays focused on layout and the action stays testable.

/**
 * Downloads markdown as a `.md` file in the visitor's browser.
 *
 * @param markdown - Raw markdown string to save.
 * @param filename - Base name without extension (e.g. video id + mode).
 */
export function downloadMarkdown(markdown: string, filename: string): void {
  downloadBlob(markdown, `${filename}.md`, "text/markdown;charset=utf-8");
}

/**
 * Downloads plain text as a `.txt` file (used for transcript downloads).
 *
 * @param text - Plain text string to save.
 * @param filename - Base name without extension.
 */
export function downloadText(text: string, filename: string): void {
  downloadBlob(text, `${filename}.txt`, "text/plain;charset=utf-8");
}

/** Shared download helper — creates a blob URL, clicks a hidden anchor, cleans up. */
function downloadBlob(content: string, fullFilename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fullFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
