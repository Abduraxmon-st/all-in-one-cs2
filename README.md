# Clutch Labs

A Counter-Strike 2 community platform prototype built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- Match analyzer interface for demo uploads and Premier share codes
- Collaborative strategy board interface
- Daily "Guess the Elo" game interface
- Budget based loadout builder interface

The current app is a front-end prototype. Match parsing, Steam sign-in, live collaboration, and market prices are not connected to backend services yet.
The daily Guess the Elo game now uses the Minigames API for challenges, guesses, leaderboards, and clip submissions. The other sections remain prototypes.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:8443/>. Run `pnpm build` to create a production build.

## Minigames API setup

Copy `.env.example` to `.env`. Set `VITE_API_PROXY_TARGET` to the backend origin for local development. Vite will forward `/api` requests, including the guest session header. For a deployed frontend on a separate origin, set `VITE_API_BASE_URL` to the API origin and allow that origin in the backend CORS settings.

Guests receive a stable browser session ID and can play without signing in. Leaderboard eligibility and community clip submissions require a JWT. Until a Steam sign-in flow is added, the daily game accepts a temporary JWT in memory and does not save it.
