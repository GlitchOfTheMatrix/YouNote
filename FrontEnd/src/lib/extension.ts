// lib/extension.ts
// Utility for communicating with the YouNote browser extension.
// The extension fetches YouTube transcripts using the client's IP address,
// avoiding server-side IP blocking by YouTube.
// Supports Chrome (direct messaging) and Firefox (content script bridge).

/**
 * The Chrome Extension ID. Set this in your .env as VITE_EXTENSION_ID
 * after loading the extension in chrome://extensions (Load unpacked).
 * (Only strictly required for Chrome direct messaging).
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
 * Automatically tries direct messaging (Chrome) and falls back to
 * window.postMessage for content script bridging (Firefox).
 */
function sendToExtension<T>(message: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Extension request timed out"));
    }, timeoutMs);

    // Try direct Chrome messaging first if available
    if (hasChromeRuntime()) {
      try {
        chrome.runtime.sendMessage(EXTENSION_ID, message, (response: unknown) => {
          if (chrome.runtime.lastError) {
            // Direct messaging failed, fallback to postMessage
            tryPostMessageFallback();
            return;
          }
          clearTimeout(timer);
          resolve(response as T);
        });
      } catch (err) {
        tryPostMessageFallback();
      }
    } else {
      tryPostMessageFallback();
    }

    function tryPostMessageFallback() {
      if (typeof window === "undefined" || !window.postMessage) {
        clearTimeout(timer);
        reject(new Error("Extension not available in this environment"));
        return;
      }

      const id = crypto.randomUUID();

      function handleMessage(event: MessageEvent) {
        if (event.source !== window) return;
        const data = event.data;
        if (data && data.type === "YOUNOTE_EXTENSION_RESPONSE" && data.id === id) {
          window.removeEventListener("message", handleMessage);
          clearTimeout(timer);
          
          if (data.response && (data.response as Record<string, unknown>).success === false && (data.response as Record<string, unknown>).error) {
             // In case the background script returned an error object
             // But we usually want to resolve the payload and let the caller check success
          }
          resolve(data.response as T);
        }
      }

      window.addEventListener("message", handleMessage);
      window.postMessage({ type: "YOUNOTE_EXTENSION_REQUEST", id, payload: message }, "*");
    }
  });
}

/**
 * Ping the extension to check if it's installed and responsive.
 * Returns true if the extension responds successfully.
 */
export async function isExtensionAvailable(): Promise<boolean> {
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
