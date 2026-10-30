# Stratboard module scaffold

- `types.ts`: lineup, tactic, room, canvas, and WebSocket event contracts.
- `api.ts`: REST endpoint paths.
- `realtime.ts`: STOMP endpoint and destinations.
- `index.ts`: public module exports.

Next integration step: add REST requests, room state, STOMP connection lifecycle, and an interactive board. No WebSocket dependency is installed yet.
