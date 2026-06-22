# YouNote

Turn a YouTube link into AI-generated notes — full notes or a tight summary —
then ask follow-up questions about the video. This build uses mock data
(`src/lib/mock-notes.ts`) for note generation and chat answers, so it runs
fully offline with no API keys.

## Stack

React 19 · TypeScript · Vite 7 · TanStack Start (file-based routing) ·
TanStack Query · CSS Modules · Tailwind CSS v4

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Port and app name are configurable in `.env`.

```bash
npm run build   # production build (outputs to dist/ + .output/)
npm run start   # serve the production build
npm run typecheck
```

## How it's organized

```
src/
  routes/             file-based routes (/, /notes)
  components/         Header, UrlForm, NotesView, ChatPanel, ThemeToggle
                       (each paired with its own *.module.css)
  lib/mock-notes.ts   URL parsing + mock "AI" note/chat generation
  styles.css          design tokens (light + dark theme variables)
```

## Light / dark theme

Toggled from the sun/moon button in the header. The choice is saved to
`localStorage` and applied via a `data-theme="light" | "dark"` attribute on
`<html>`, set by a small inline script in `src/routes/__root.tsx` that runs
before first paint — so there's no flash of the wrong theme on load. Every
component is themed purely through CSS variables defined in `src/styles.css`;
no component branches on theme in JS.

## Swapping in a real backend

`generateNotes(url, mode)` and `askFollowUp(question)` in
`src/lib/mock-notes.ts` are the only two functions that need real
implementations — everything else (loading states, error handling, caching
per `[url, mode]`, chat persistence) already works against their current
mock async signatures.
