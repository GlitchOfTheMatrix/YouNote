// hooks/useClipboard.ts
// Copies text to the clipboard and briefly surfaces a "copied" confirmation.
// Keeps notes-page copy logic out of the route component.

import { useCallback, useState } from "react";

/**
 * @param resetMs - How long the copied flag stays true (default 1.5s).
 */
export function useClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
