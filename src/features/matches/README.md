# Matches module

- `types.ts`: match, player, award, history, and roast card contracts.
- `api.ts`: public match submission, simulation, lookup, and history requests.
- `index.ts`: public module exports.

The UI is `src/pages/MatchAnalyzerPage.tsx`. The browser does not call worker-only endpoints or upload `.dem` files because the contract exposes replay URL submission instead.
