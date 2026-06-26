// lib/extension.ts
// Utility for communicating with the YouNote browser extension.
// The extension fetches YouTube transcripts using the client's IP address,
// avoiding server-side IP blocking by YouTube.

/**
 * The Chrome Extension ID. Set this in your .env as VITE_EXTENSION_ID
 * after loading the extension in chrome://extensions (Load unpacked).
 */
const EXTENSION_ID: string = import.meta.env.VITE_EXTENSION_ID || "";

interface ExtensionTranscriptResponse {
  success: boolean;
  transcript?: string;
  segments?: Array<{
    text: string;
    start: number;
    duration: number;
    end: number;
  }>;
  videoId?: string;
  rateLimitRemaining?: number;
  error?: string;
}

interface ExtensionPingResponse {
  success: boolean;
  version?: string;
}

/**
 * Check whether the Chrome runtime API and the extension ID are available.
 * Does NOT guarantee the extension is installed — use `isExtensionAvailable` for that.
 */
function hasChromeRuntime(): boolean {
  return (
    typeof chrome !== "undefined" &&
    typeof chrome.runtime !== "undefined" &&
    typeof chrome.runtime.sendMessage === "function" &&
    EXTENSION_ID.length > 0
  );
}

/**
 * Send a message to the extension and return the response.
 * Wraps chrome.runtime.sendMessage in a Promise with a timeout.
 */
function sendToExtension<T>(message: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!hasChromeRuntime()) {
      reject(new Error("Extension not available"));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error("Extension request timed out"));
    }, timeoutMs);

    try {
      chrome.runtime.sendMessage(EXTENSION_ID, message, (response: unknown) => {
        clearTimeout(timer);

        // Check for Chrome runtime errors (extension not installed, etc.)
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || "Extension communication error"));
          return;
        }

        resolve(response as T);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

/**
 * Ping the extension to check if it's installed and responsive.
 * Returns true if the extension responds successfully.
 */
export async function isExtensionAvailable(): Promise<boolean> {
  if (!hasChromeRuntime()) return false;

  try {
    const response = await sendToExtension<ExtensionPingResponse>(
      { action: "ping" },
      3000,
    );
    return response?.success === true;
  } catch {
    return false;
  }
}

/**
 * Fetch a YouTube transcript through the browser extension.
 * The extension fetches directly from YouTube using the client's IP.
 *
 * @param videoId - The 11-character YouTube video ID.
 * @returns The full transcript as plain text.
 * @throws Error if the extension is not available or the fetch fails.
 */
export async function getTranscriptFromExtension(videoId: string): Promise<string> {
  const response = await sendToExtension<ExtensionTranscriptResponse>({
    action: "fetchTranscript",
    videoId,
  });

  if (!response || !response.success) {
    throw new Error(response?.error || "Extension failed to fetch transcript");
  }

  if (!response.transcript || response.transcript.trim().length === 0) {
    throw new Error("Extension returned an empty transcript");
  }

  return response.transcript;
}
