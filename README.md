# Clutch Labs

A Counter-Strike 2 community platform prototype built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- Match analyzer interface for demo uploads and Premier share codes
- Collaborative strategy board interface
- Daily "Guess the Elo" game interface
- Budget based loadout builder, catalog, and community feed

Match parsing, Steam sign-in, and live collaboration are still prototypes. The Minigames and Loadouts screens require a configured backend API.
The daily Guess the Elo game uses the Minigames API for challenges, guesses, leaderboards, and clip submissions. Loadout Lab uses the Loadouts API for catalog search, budget generation, and community loadouts. Match analysis and strategy planning remain prototypes.

Identity and Stratboard have initial feature folders with contract types and endpoint paths. Their API calls and UI integration are the next implementation step.

## Pages and routes

Routes are defined in `src/routes.ts`. Every page component lives in `src/pages/`:

| URL | Page |
| --- | --- |
| `/` | `CommandCenterPage.tsx` |
| `/match-analyzer` | `MatchAnalyzerPage.tsx` |
| `/strat-board` | `StratBoardPage.tsx` |
| `/daily-games` | `DailyGamesPage.tsx` |
| `/loadout-lab` | `LoadoutPage.tsx` |

`src/App.tsx` holds the shared layout. API clients and data types remain in `src/features/`.
Deployment hosting must serve `index.html` for deep links to these routes.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:8443/>. Run `pnpm build` to create a production build.

## API setup

Copy `.env.example` to `.env`. Set `VITE_API_PROXY_TARGET` to the backend origin for local development. Vite will forward `/api` requests. For a deployed frontend on a separate origin, set `VITE_API_BASE_URL` to the API origin and allow that origin in the backend CORS settings.

Guests receive a stable browser session ID and can play without signing in. Leaderboard eligibility and community clip submissions require a JWT. Until a Steam sign-in flow is added, the daily game accepts a temporary JWT in memory and does not save it.

Loadout Lab's catalog, generator, and community feed are public. Saving a loadout, upvoting, and deleting require a JWT. Admin catalog seed and sync methods are available in the API client but have no public UI.
