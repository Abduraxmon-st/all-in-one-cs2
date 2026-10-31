# Stratboard module

- `types.ts`: lineup, tactic, room, canvas, and WebSocket event contracts.
- `api.ts`: REST endpoint paths and requests.
- `realtime.ts`: STOMP connection, events, and destinations.
- `index.ts`: public module exports.

The interactive page is `src/pages/StratBoardPage.tsx`. Guest rooms work without login; saving tactics and submitting lineups require sign-in.
