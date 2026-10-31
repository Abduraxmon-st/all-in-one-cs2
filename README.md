# Clutch Labs

A Counter-Strike 2 community platform prototype built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- Match analyzer for Premier share codes and replay URLs, with status, scoreboard, history, roast cards, and share links
- Collaborative strategy board with guest rooms, live edits, lineups, and saved tactics
- Daily "Guess the Elo" game with challenges, guesses, leaderboards, and clip submissions
- Budget based loadout builder, catalog, and community feed
- Steam sign-in, development login, and profile editing

Feature pages use the supplied OpenAPI contract. Match parsing depends on the backend worker; live strategy rooms depend on the backend STOMP endpoint. Steam authentication requires the backend's `FRONTEND_AUTH_REDIRECT` to point to this frontend's `/auth/callback` route. Internal worker callbacks require a server-side secret and are intentionally excluded from the browser client.

## Pages and routes

Routes are defined in `src/routes.ts`. Every page component lives in `src/pages/`:

| URL | Page |
| --- | --- |
| `/` | `CommandCenterPage.tsx` |
| `/match-analyzer` | `MatchAnalyzerPage.tsx` |
| `/strat-board` | `StratBoardPage.tsx` |
| `/daily-games` | `DailyGamesPage.tsx` |
| `/loadout-lab` | `LoadoutPage.tsx` |
| `/m/:shareSlug` | `MatchAnalyzerPage.tsx` (shared report) |
| `/strat-board/:roomCode` | `StratBoardPage.tsx` (room invite) |
| `/admin` | `AdminPage.tsx` (administrator tools and service health) |
| `/profile` | `ProfilePage.tsx` (your profile and saved loadouts) |
| `/users/:userId` | `ProfilePage.tsx` (public player profile and match history) |
| `/auth/callback` | Steam callback handled by `AuthProvider.tsx` before page rendering |

`src/App.tsx` holds the shared layout. API clients and data types remain in `src/features/`.
Deployment hosting must serve `index.html` for deep links to these routes.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:8443/>. Run `pnpm build` to create a production build.

## API setup

The frontend defaults to `https://panda-cs.onrender.com` for API requests. Copy `.env.example` to `.env` only when overriding the API origin. For a local Vite proxy, set `VITE_API_BASE_URL` to an empty value and `VITE_API_PROXY_TARGET` to the backend origin.

Guests receive a stable browser session ID and can play without signing in. Steam sign-in supplies a shared JWT for leaderboard eligibility, community clip submissions, loadout actions, and saving tactics. The token is kept in tab session storage and removed from the callback URL immediately.

Loadout Lab's catalog, generator, and community feed are public. Saving a loadout, upvoting, and deleting require a JWT.
The admin console is visible to administrator accounts and provides clip moderation, daily challenge generation, catalog seed/sync, and service health. The backend enforces admin permissions on these requests.
