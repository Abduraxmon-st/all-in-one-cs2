# Clutch Labs — Frontend Workspace Rules

## 1. Tech Stack & Architecture
- **Framework & Runtime:** React 19 (`react`, `react-dom`), TypeScript 5.7
- **Build Tool & Bundler:** Vite 8 (`@vitejs/plugin-react`), ESM modules, target ES2020
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite` plugin (`@import "tailwindcss";` in `src/index.css`)
- **Real-Time WebSockets:** `@stomp/stompjs` 7.5 for live collaborative strat board rooms
- **Routing:** Custom client-side history router (`src/routes.ts`) using HTML5 `history.pushState` and custom event bus (`clutch-labs-route-change`)
- **Code Formatting:** `oxfmt`

## 2. Backend API Wiring & Protocol Target
- **Default Origin:** `https://panda-cs.onrender.com` (`src/config/api.ts`). Overridable via `VITE_API_BASE_URL` or local proxy `VITE_API_PROXY_TARGET`.
- **Response Envelope:** All backend API endpoints conform to `ApiResponseDto<T>`:
  ```ts
  interface ApiResponseDto<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp?: string;
  }
  ```
- **Authentication & Headers:**
  - Authenticated requests include `Authorization: Bearer <accessToken>`.
  - Unauthenticated minigame guest requests include `X-Guest-Session-Id: <uuid>`.

## 3. Zero-Broken-Build Quality Gate
- **Strict Requirement:** Every sprint task must pass both:
  1. TypeScript type checking: `npx tsc --noEmit` (0 errors)
  2. Production Vite bundling: `npm run build` or `pnpm build` (clean exit code 0)
- No task branch shall be merged into `main` with broken imports, type regressions, or failed bundling.

## 4. Git & Branching Workflow
- **Branching Pattern:** Each sprint task is developed on an isolated feature branch:
  `feat/task-fX-<short-description>` (e.g. `feat/task-f1-minigames-embeds`)
- **Verification:** Build & typecheck must be verified before staging.
- **Commit Format:** Conventional Commits standard:
  - `feat(...)`: new feature implementation
  - `fix(...)`: bug fix or edge case resolution
  - `chore(...)`: tooling, dependency updates, baseline configuration
  - `refactor(...)`: restructuring code without behavioral changes
- **Integration:** Feature branches are merged cleanly into `main` upon task completion.
