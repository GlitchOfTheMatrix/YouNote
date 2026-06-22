# YouNote Backend

FastAPI backend that converts YouTube videos into AI-generated markdown notes and answers follow-up questions grounded in those notes.

## Requirements

- Python 3.13+
- A Google Gemini API key

## Installation

```bash
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Environment setup

Copy or edit `.env` in the project root:

```env
PORT=8000
GEMINI_API_KEY=your-key-here
MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:3000
```

Optional limits (defaults shown):

```env
MAX_TRANSCRIPT_CHARS=120000
MAX_QUESTION_LENGTH=1000
MAX_NOTES_CONTEXT_CHARS=200000
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (used when running via uvicorn with `--port`) |
| `GEMINI_API_KEY` | Google Gemini API key — required for note generation and chat |
| `MODEL` | Gemini model name |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

## Running locally

From the project root (where `app/` lives):

```bash
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000` by default. Interactive docs: `http://127.0.0.1:8000/docs`.

## API endpoints

### Health

`GET /health`

```json
{ "status": "ok" }
```

### Generate notes

`POST /notes`

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "mode": "full"
}
```

`mode` is `"full"` or `"summary"`.

Response:

```json
{
  "title": "Video title",
  "videoId": "dQw4w9WgXcQ",
  "notes": "# Markdown notes..."
}
```

Example with curl:

```bash
curl -X POST http://127.0.0.1:8000/notes \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","mode":"summary"}'
```

### Chat

`POST /chat`

Request:

```json
{
  "notes": "# Markdown notes from /notes...",
  "question": "What are the key takeaways?"
}
```

Response:

```json
{
  "answer": "Based on the notes..."
}
```

Example with curl:

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"notes":"# Sample notes","question":"Summarize in one sentence"}'
```

## Error responses

| Status | When |
|--------|------|
| `400` | Invalid YouTube URL |
| `404` | Video unavailable |
| `422` | Malformed request body or validation failure |
| `429` | Gemini API rate limit |
| `500` | Missing configuration or unexpected server error |
| `502` | Gemini API service error |
| `503` | Transcript unavailable or disabled |

Errors return `{ "detail": "message" }`. Stack traces are never exposed.

## Project structure

```
app/
├── main.py              # FastAPI app, CORS, global error handlers
├── config.py            # Environment-based settings
├── prompts.py           # LLM prompt templates
├── api/
│   ├── health.py        # GET /health
│   ├── notes.py         # POST /notes
│   └── chat.py          # POST /chat
├── models/
│   ├── request.py       # Pydantic request bodies
│   └── response.py      # Pydantic response bodies
├── services/
│   ├── transcript_service.py  # YouTube transcript fetch
│   ├── notes_service.py         # LLM note generation
│   └── chat_service.py          # LLM follow-up Q&A
└── utils/
    └── youtube.py       # URL validation and video title lookup
```

## Workflow

**Generate notes**

1. Validate YouTube URL and extract video ID
2. Download and join transcript segments
3. Send transcript to Gemini with mode-specific prompt
4. Return markdown notes and video metadata

**Chat**

1. Receive notes and question
2. Ask Gemini using notes as the only context
3. Return the answer

## Supported YouTube URL formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Mobile: `https://m.youtube.com/watch?v=VIDEO_ID`

## Frontend integration

Point the frontend at `http://127.0.0.1:8000`. CORS allows `http://localhost:3000` by default. Update `ALLOWED_ORIGINS` if the frontend runs elsewhere.

The frontend currently uses mocks in `lib/api.ts`. Replace those calls with `fetch` to `/notes` and `/chat` when wiring up the real backend.
