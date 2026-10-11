# rookpilot.in

The Rookpilot web app: where you set up your building, see what's due, and chat with Rookpilot.

**Status: phase 1 (UI only).** There is no backend yet. Sign-up and log-in don't create accounts. The app runs on sample data held in the browser: your changes last until you refresh.

## Run it

Requires Node 20.9 or newer (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Routes

| Route | Page |
| --- | --- |
| `/` | Redirects to `/signup` |
| `/signup`, `/login` | Auth pages. Every button continues to onboarding. |
| `/onboarding` | 5-step wizard: address and type are required; basics, rooms, and items can be skipped. Finishing adds the building. |
| `/app` | Home: what's due, next tasks, and the chat (stub reply) |
| `/app/building` | Rooms, items, and timers. `?room=` and `?item=` select what's shown. |
| `/app/schedule`, `/history`, `/projects`, `/repairs`, `/contacts`, `/settings` | Placeholders for later PRs |

## Project layout

```
app/                  Routes only. Pages are thin and render a feature.
components/ui/        shadcn/ui primitives
components/form/      Shared form controls (FormField, CountStepper, NativeSelect)
components/brand/     Logo
features/<name>/      One folder per feature: components/, hooks/, and plain logic
lib/domain/           Types and helpers for buildings, rooms, schedules
lib/templates/        Starter room and item catalogs
lib/scheduling.ts     Due dates: next due, overdue / due soon, labels
lib/data/             Sample-data store, reducer, selectors (replaced by the API in phase 2)
```

Components read data through `useAppData()` and change it through `dispatch()` in `lib/data/store.ts`. Phase 2 swaps that module for API calls without changing the components.

Each feature keeps React out of its logic. For example, onboarding has a pure reducer (`state.ts`), pure validation and totals (`selectors.ts`), one hook that wires them together (`hooks/use-onboarding.ts`), and components that only render. Logic files have tests next to them (`*.test.ts`).

### Next.js notes

This project uses Next.js 16 with Cache Components on. Visited pages stay mounted in the background, so component state survives navigation. Forms that should start fresh need to reset their own state before navigating away; see `useAuthForm` and `useOnboarding`.
