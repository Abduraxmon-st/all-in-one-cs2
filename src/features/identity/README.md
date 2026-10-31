# Identity module

- `types.ts`: login and user profile data contracts.
- `api.ts`: Steam/dev login and profile requests.
- `AuthProvider.tsx`: shared session state and callback handling.
- `AuthPanel.tsx`: sign-in and profile UI.
- `index.ts`: public module exports.

Development login is shown only in Vite development mode and requires the backend's dev mode. The backend's `FRONTEND_AUTH_REDIRECT` must point to this frontend's `/auth/callback` route.
