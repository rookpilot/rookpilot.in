# rookpilot.in

The Rookpilot web app: where you set up your building, see what's due, and chat with Rookpilot.

**Status: phase 2 in progress.** Supabase is set up, but nothing uses it yet. Sign-up and log-in don't create accounts. The app runs on sample data held in the browser: your changes last until you refresh.

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
| `npm run db:start` | Start local Supabase in Docker |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:status` | Show local Supabase URLs and keys |

## Supabase

Phase 2 moves data to Supabase. Day-to-day work runs against a local copy in Docker, so testing never touches the real project. Requires Docker Desktop with WSL integration turned on.

```bash
npm run db:start                 # first run downloads images; prints the API URL and publishable key
cp .env.example .env.local       # paste the publishable key into .env.local
npm run dev
```

Local Studio (a dashboard for the local database) runs at http://127.0.0.1:54323.

The `supabase/` folder holds the local config, and later the table changes (`migrations/`) and sample data (`seed.sql`). To connect the CLI to the hosted project once per machine:

```bash
npx supabase login
npx supabase link --project-ref <project-id>    # the ID in your dashboard URL
```

Code connects through `lib/supabase/`: `client.ts` in Client Components, `server.ts` in Server Components and Server Actions. `proxy.ts` at the root keeps the login fresh on every request.

## Routes

| Route | Page |
| --- | --- |
| `/` | Redirects to `/signup` |
| `/signup`, `/login` | Auth pages. Every button continues to onboarding. |
| `/onboarding` | 5-step wizard, one full screen per step with dots at the bottom: address and type are required; basics, rooms, and items can be skipped. Finishing adds the building. |
| `/app` | Home: overdue, due this week, open repairs, next tasks with Mark done, and work in progress |
| `/app/schedule` | Every timer as a list, week, or month. `?view=` and `?date=`; the last view is remembered. |
| `/app/building` | Rooms, items, timers, and each item's history. `?room=` and `?item=` select what's shown. |
| `/app/history` | Everything finished, filterable by type, room, and contact |
| `/app/projects`, `/app/repairs` | One shared list, detail, and form. `?id=` opens one. |
| `/app/contacts` | People who help, with photo, Instagram, and what they helped with. `?id=` opens one. |
| `/app/settings` | Edit or delete the building, switch buildings, theme |

### Shortcuts

| Keys | What it does |
| --- | --- |
| ⌘K / Ctrl+K | Search: jump to a tab, item, contact, or building |
| ⌘J / Ctrl+J | Open or close the Rookpilot chat (stub reply until phase 3) |
| ⌘B / Ctrl+B | Collapse or expand the sidebar (remembered) |

## Project layout

```
app/                  Routes only. Pages are thin and render a feature.
components/ui/        shadcn/ui primitives
components/form/      Shared form controls (FormField, MoneyField, TextareaField, FormDialog, …)
components/           Shared pieces used by several features (ContactAvatar, HistoryList, EmptyState, …)
hooks/                Hooks not tied to one feature (useSelectedId, useLocalPreference)
components/brand/     Logo
features/<name>/      One folder per feature: components/, hooks/, and plain logic
lib/domain/           Types and helpers for buildings, rooms, schedules, contacts, projects and repairs
lib/templates/        Starter room and item catalogs
lib/scheduling.ts     Due dates: next due, overdue / due soon, labels, what Mark done does
lib/calendar.ts       Week and month grid math
lib/data/             Sample-data store, reducer, selectors (replaced by the API in phase 2)
```

Components read data through `useAppData()`. Changes go through each feature's `actions.ts` (for example `features/work/actions.ts`), which fill in ids and dates and call `dispatch()` in `lib/data/store.ts`. Phase 2 swaps that module for API calls without changing the components.

Each feature keeps React out of its logic. For example, onboarding has a pure reducer (`state.ts`), pure validation and totals (`selectors.ts`), one hook that wires them together (`hooks/use-onboarding.ts`), and components that only render. Logic files have tests next to them (`*.test.ts`).

### Look and feel

The look is plain, like Clavr: neutral grays with a near-black accent (near-white in dark mode), Bricolage Grotesque headings, Public Sans text, and JetBrains Mono labels. Color is saved for meaning: overdue, due soon, done, and projects and repairs. Every color is a token in `app/globals.css`, with a dark set under `.dark`, so components never hard-code colors. Shared pieces carry the style: the `surface` utility for soft cards, `SegmentedControl` and `FilterChips`, `selectableRow` for list → detail rows, and the `eyebrow` and `group-label` utilities.

### Next.js notes

This project uses Next.js 16 with Cache Components on. Visited pages stay mounted in the background, so component state survives navigation. Forms that should start fresh need to reset their own state before navigating away; see `useAuthForm` and `useOnboarding`.
