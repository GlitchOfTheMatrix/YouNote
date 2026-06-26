# YouNote Transcript Fetcher Extension

A lightweight browser extension designed to work alongside the **YouNote** web application. It fetches YouTube video transcripts using the client's IP address, completely bypassing server-side IP rate limiting and blocking.

## Why is this needed?

YouTube frequently blocks server-side requests (like those coming from a deployed FastAPI backend) because they originate from datacenter IPs and lack standard browser headers. This extension acts as a proxy:
1. The YouNote React frontend asks the extension for the transcript.
2. The extension fetches the transcript directly from YouTube using your home IP address.
3. The extension hands the transcript back to the frontend.
4. The frontend sends it to the backend for AI processing via Gemini.

## Features

- ✅ **Client-Side Extraction**: Fetches captions using your browser's context.
- ✅ **Seamless Integration**: Automatically responds to messages from the YouNote web app.
- ✅ **Fallback Ready**: If you don't have the extension installed, YouNote seamlessly falls back to server-side fetching.
- ✅ **Rate Limit Protection**: Built-in sliding window rate limiter prevents your IP from being flagged by YouTube.

## Installation

### 1. Load the Extension
1. Open Chrome/Chromium and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this `Extension` folder
5. The extension icon should appear in your toolbar.

### 2. Configure YouNote Frontend
After loading the extension, Chrome assigns it a unique ID.
1. Click the extension icon in your browser toolbar to open the popup.
2. Click the **Extension ID** to copy it to your clipboard.
3. Open your YouNote `FrontEnd/.env` file.
4. Add the ID as follows:
   ```env
   VITE_EXTENSION_ID=your_copied_extension_id_here
   ```
5. Restart your frontend dev server.

## Troubleshooting

- **Extension not connecting?** Make sure you copied the correct Extension ID into the `VITE_EXTENSION_ID` environment variable and that your frontend is running on a supported origin (like `http://localhost:3000`).
- **No transcript found?** The video might be age-restricted or lack captions entirely.
