// Service Worker for YouNote Transcript Fetcher
// Handles transcript fetching from YouTube using the client's IP address.
// Supports both popup-initiated requests (onMessage) and frontend-initiated
// requests (onMessageExternal) so the YouNote web app can ask for transcripts.

class RateLimiter {
    constructor(maxRequests, windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMs = windowSeconds * 1000;
        this.requestTimestamps = [];
    }

    async canMakeRequest() {
        await this.loadTimestamps();
        const now = Date.now();

        // Remove timestamps outside the current window
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => now - ts < this.windowMs
        );

        const allowed = this.requestTimestamps.length < this.maxRequests;
        return { allowed, remaining: this.maxRequests - this.requestTimestamps.length };
    }

    async recordRequest() {
        await this.loadTimestamps();
        this.requestTimestamps.push(Date.now());
        await this.saveTimestamps();
    }

    async loadTimestamps() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['requestTimestamps'], (data) => {
                this.requestTimestamps = data.requestTimestamps || [];
                resolve();
            });
        });
    }

    async saveTimestamps() {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ requestTimestamps: this.requestTimestamps }, resolve);
        });
    }

    getTimeUntilReset() {
        if (this.requestTimestamps.length === 0) return 0;
        const oldestTimestamp = this.requestTimestamps[0];
        const resetTime = oldestTimestamp + this.windowMs;
        const timeUntil = Math.max(0, resetTime - Date.now());
        return Math.ceil(timeUntil / 1000);
    }
}

// Initialize rate limiter globally with hardcoded defaults
// 100 requests per hour (3600 seconds)
const rateLimiter = new RateLimiter(100, 3600);

// ---------------------------------------------------------------------------
// Internal message listener (from popup)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchTranscript') {
        handleFetchTranscript(request.videoId, sendResponse);
        return true; // Keep the channel open for async response
    }
});

// ---------------------------------------------------------------------------
// External message listener (from the YouNote frontend webpage)
// ---------------------------------------------------------------------------
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchTranscript' && request.videoId) {
        handleFetchTranscript(request.videoId, sendResponse);
        return true; // Keep the channel open for async response
    }

    if (request.action === 'ping') {
        // Let the frontend check if the extension is installed and responsive
        sendResponse({ success: true, version: chrome.runtime.getManifest().version });
        return false;
    }
});

// ---------------------------------------------------------------------------
// Core transcript fetching logic
// ---------------------------------------------------------------------------

async function handleFetchTranscript(videoId, sendResponse) {
    try {
        // Ensure rate limiter is initialized
        await initializeRateLimiter();

        // Check rate limit
        const { allowed, remaining } = await rateLimiter.canMakeRequest();
        if (!allowed) {
            const timeUntil = rateLimiter.getTimeUntilReset();
            const error = `Rate limit exceeded. Try again in ${timeUntil} seconds.`;
            sendResponse({ success: false, error });
            return;
        }

        // Record this request
        await rateLimiter.recordRequest();

        // Fetch transcript from YouTube using the client's IP
        const transcript = await fetchYouTubeTranscript(videoId);
        if (!transcript || transcript.length === 0) {
            throw new Error('No transcript found for this video');
        }

        // Join transcript segments into plain text
        const fullText = transcript
            .map(seg => seg.text.trim())
            .filter(t => t.length > 0)
            .join(' ');

        sendResponse({
            success: true,
            transcript: fullText,
            segments: transcript,
            videoId: videoId,
            rateLimitRemaining: remaining - 1
        });

    } catch (error) {
        console.error('Error in handleFetchTranscript:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

async function initializeRateLimiter() {
    if (!rateLimiter) {
        const data = await new Promise((resolve) => {
            chrome.storage.sync.get(['rateLimit', 'windowSize'], resolve);
        });
        rateLimiter = new RateLimiter(data.rateLimit || 10, data.windowSize || 60);
    }
}

// ---------------------------------------------------------------------------
// YouTube transcript fetching
// ---------------------------------------------------------------------------

async function fetchYouTubeTranscript(videoId) {
    try {
        // Fetch the YouTube page to extract caption track URLs
        const pageHtml = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
            .then(r => r.text());

        // Try to extract captions from ytInitialPlayerResponse (more reliable)
        const playerResponseMatch = pageHtml.match(
            /var\s+ytInitialPlayerResponse\s*=\s*({.*?});/s
        ) || pageHtml.match(
            /ytInitialPlayerResponse\s*=\s*({.*?});/s
        );

        if (playerResponseMatch) {
            try {
                const playerResponse = JSON.parse(playerResponseMatch[1]);
                const captionTracks =
                    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                if (captionTracks && captionTracks.length > 0) {
                    // Prefer English, fall back to first available
                    const englishTrack = captionTracks.find(
                        t => t.languageCode === 'en' || t.languageCode?.startsWith('en')
                    );
                    const track = englishTrack || captionTracks[0];
                    const captionUrl = track.baseUrl;

                    if (captionUrl) {
                        return await fetchAndParseCaptions(captionUrl);
                    }
                }
            } catch (parseErr) {
                console.warn('Failed to parse ytInitialPlayerResponse:', parseErr);
            }
        }

        // Fallback: try the timedtext API directly
        return await fetchTranscriptViaTimedtext(videoId);

    } catch (error) {
        console.error('Error fetching transcript via primary method:', error);

        // Last resort fallback
        try {
            return await fetchTranscriptViaTimedtext(videoId);
        } catch (fallbackError) {
            console.error('Timedtext fallback also failed:', fallbackError);
            return [];
        }
    }
}

async function fetchAndParseCaptions(captionUrl) {
    const response = await fetch(captionUrl);
    if (!response.ok) {
        throw new Error(`Caption fetch failed: ${response.status}`);
    }
    const captionXml = await response.text();
    return parseTranscriptXml(captionXml);
}

async function fetchTranscriptViaTimedtext(videoId) {
    const response = await fetch(
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }
    );

    if (!response.ok) {
        return [];
    }

    const captionXml = await response.text();
    return parseTranscriptXml(captionXml);
}

/**
 * Parse YouTube caption XML into transcript segments.
 * Service workers do NOT have DOMParser, so we use regex-based parsing.
 */
function parseTranscriptXml(xml) {
    const transcript = [];

    // Match <text start="..." dur="...">content</text> elements
    const textRegex = /<text\s+([^>]*)>([\s\S]*?)<\/text>/gi;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
        const attrs = match[1];
        const rawContent = match[2];

        // Extract start and dur attributes
        const startMatch = attrs.match(/start="([^"]+)"/);
        const durMatch = attrs.match(/dur="([^"]+)"/);

        const start = startMatch ? parseFloat(startMatch[1]) : 0;
        const duration = durMatch ? parseFloat(durMatch[1]) : 0;

        // Decode HTML entities in the text content
        const text = decodeHtmlEntities(rawContent).trim();

        if (text) {
            transcript.push({
                text: text,
                start: start,
                duration: duration,
                end: start + duration
            });
        }
    }

    return transcript;
}

/**
 * Decode common HTML entities found in YouTube captions.
 */
function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\n/g, ' ');
}

// ---------------------------------------------------------------------------
// Listen for storage changes to update rate limiter config
// ---------------------------------------------------------------------------
chrome.storage.onChanged.addListener((changes) => {
    if (changes.rateLimit || changes.windowSize) {
        chrome.storage.sync.get(['rateLimit', 'windowSize'], (data) => {
            rateLimiter = new RateLimiter(data.rateLimit || 10, data.windowSize || 60);
        });
    }
});
