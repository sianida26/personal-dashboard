# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

- **Install dependencies:** `bun install`
- **Dev mode (all apps):** `bun run dev`
- **Build all:** `bun run build`
- **Lint & format:** `bun run lint` / `bun run format`
- **Type check:** `bun run check`

### App-Specific Commands

**Backend** (`apps/backend`):
- `bun run dev` - Watch mode with hot reload
- `bun run db:generate` - Generate Drizzle migrations from schema changes
- `bun run db:migrate` - Run pending migrations
- `bun run db:seed` - Seed database with initial data
- `bun run db:studio` - Open Drizzle Studio UI
- `bun run db:prepare` - Run migrations + seed combined
- `bun test` - Run test suite (uses `NODE_ENV=test` and `.env.test.local`)
- `bun test:coverage` - Run tests with coverage report

**Frontend** (`apps/frontend`):
- `bun run dev` - Vite dev server with HMR
- `bun run build` - Production build
- `bun run preview` - Preview production build locally

## Project Architecture

### Monorepo Structure

**Managed by:** Turborepo + Bun
**Package manager:** Bun (v1.3.1+)

```
.
├── apps/
│   ├── backend/    # HonoJS API (TypeScript, Drizzle ORM, PostgreSQL)
│   └── frontend/   # React app (TypeScript, Vite, TanStack Router/Query)
├── packages/       # Shared, reusable code
│   ├── data/       # Static/shared data exports
│   ├── hooks/      # Shared React hooks
│   ├── ui/         # Shadcn-based UI components (Radix UI, TailwindCSS)
│   ├── validation/ # Zod schemas for shared validation
│   └── typescript-config/ # Shared TypeScript config
```

### Backend Architecture

**Location:** `apps/backend/src`

**Technology Stack:**
- Framework: HonoJS (lightweight, edge-runtime compatible)
- ORM: Drizzle ORM (PostgreSQL)
- Auth: JWT + session tokens
- Database: PostgreSQL (strict schema via Drizzle)
- Observability: OpenTelemetry (traces, metrics, logs)
- Email: Nodemailer
- Rate limiting: hono-rate-limiter
- AI: Vercel AI SDK (OpenAI)

**Core Structure:**
```
src/
├── index.ts           # App entry, route aggregation, middleware
├── appEnv.ts          # Environment variable validation
├── drizzle/           # ORM layer (schema, migrations, seeds)
│   ├── schema/        # Table definitions ([Model]Schema.ts)
│   ├── migrations/    # Auto-generated (DO NOT EDIT)
│   └── seed.ts        # Seeding script
├── routes/            # API endpoints (organized by resource)
├── services/          # Business logic (notifications, jobs, webhooks)
├── middlewares/       # Hono middleware (auth, permissions, logging, rate limit)
├── modules/           # Standalone features/integrations
├── jobs/              # Background job queue (job definitions, schedulers)
├── types/             # TypeScript type definitions
├── utils/             # Helpers (error tracking, logger, validation, etc.)
└── errors/            # Custom error classes
```

**Key Patterns:**
- **Routes:** Organized by domain (e.g., `/routes/users/`, `/routes/auth/`). Each route file exports a Hono app mounted in `index.ts`.
- **Services:** Encapsulate business logic (e.g., `NotificationService`, `WebhookService`). Injected into routes.
- **Middleware:** Auth, permission checking, request logging, rate limiting applied globally or per-route.
- **Drizzle Schema:** Each table defined in `schema/[Model]Schema.ts`. All relations explicitly defined. **Never edit migrations directly.**

**Database/Drizzle Rules:**
- Table names: snake_case, plural (e.g., `users`, `roles_to_users`)
- Schema variable: `[ModelName]Schema` (e.g., `usersSchema`)
- All foreign keys must use explicit relations via Drizzle's `relations()` helper
- Use join tables for many-to-many relationships
- No `any` types; use specific types or `unknown`
- See `apps/backend/src/drizzle/README.md` for strict rules

### Frontend Architecture

**Location:** `apps/frontend/src`

**Technology Stack:**
- Framework: React 19 (Vite)
- Routing: TanStack Router (file-based, generated)
- Data fetching: TanStack React Query (React Query)
- Forms: Mantine Form + Zod resolver
- UI Components: Shadcn-based (Radix UI primitives, TailwindCSS)
- Tables: TanStack React Table with virtualization
- DnD: @dnd-kit (drag-and-drop)
- Charts: Recharts
- Notifications: Sonner (toast)
- API Client: `honoClient` utility + `fetchRPC` helper
- State: React Context (Auth, Theme, Notifications, App)
- Storage: IndexedDB via Dexie (auth tokens, theme preference)
- Observability: OpenTelemetry (Web SDK)

**Core Structure:**
```
src/
├── App.tsx           # Root component (providers, router)
├── main.tsx          # Entry point
├── routes/           # TanStack Router file-based routes (auto-generated tree)
├── components/       # React components (organized by feature/domain)
├── contexts/         # Global state (Auth, Theme, Notifications, App)
├── hooks/            # Custom React hooks (some shared via @repo/hooks)
├── honoClient.ts     # Typed API client for backend
├── indexedDB/        # Dexie database schemas (auth, theme)
├── styles/           # TailwindCSS, global styles
├── utils/            # Helpers (auth bridge, JWT parsing, etc.)
├── config/           # Config (theme, constants)
├── types/            # TypeScript definitions
└── errors/           # Error handling, boundaries
```

**Key Patterns:**
- **Routing:** File-based via TanStack Router. Route files in `src/routes/` auto-generate `routeTree.gen.ts` (don't edit).
- **API Calls:** Use `honoClient` (typed RPC client) for backend calls. Mutations should not retry.
- **Data Fetching:** TanStack React Query with smart retry logic (network errors only, max 2 retries, exponential backoff).
- **Forms:** Mantine Form + Zod validation. Schemas imported from `@repo/validation`.
- **State Management:** React Context for global (Auth, Theme, Notifications). Component state for local UI.
- **Components:** Shadcn-based, accessible (Radix UI), responsive. Keep in `src/components/`.
- **Error Handling:** AppErrorBoundary wraps routes. Custom error types in `src/errors/`.

**React Query Config** (see App.tsx):
- `staleTime: 0` - Treat all data as immediately stale
- `refetchOnWindowFocus: false` - Don't refetch on window focus (server might be down)
- `refetchOnReconnect: false` - Don't auto-refetch on network reconnect
- `refetchOnMount: false` - Don't refetch if data already cached
- `placeholderData: (previousData) => previousData` - Keep stale UI during refetch (critical for UX)
- Mutations: No retry (side effects risk)
- Smart retry: Only on genuine network errors, max 2 attempts, exponential backoff

### Shared Packages

**@repo/validation**: Zod schemas for shared validation (auth, users, permissions, etc.)
**@repo/ui**: Shadcn-based components, TailwindCSS utilities
**@repo/hooks**: Shared React hooks
**@repo/data**: Static data (permissions, roles, etc.)
**@repo/typescript-config**: Shared TypeScript config

## Code Conventions

**TypeScript:**
- No `any` type. Use specific types or `unknown`.
- Prefer null-coalescing (`??`) over logical OR (`||`).
- All functions must have JSDoc with parameters and return type.
- Complex logic requires comments explaining the "why".

**Naming:**
- Schemas/constants: PascalCase (`UserSchema`, `PERMISSIONS`)
- Functions/variables: camelCase
- Database tables: snake_case, plural (`users`, `roles_to_users`)
- Components: PascalCase (`UserForm.tsx`, `Table.tsx`)
- Routes/paths: kebab-case (`user-settings.tsx`)

**Imports:**
- Use workspace imports: `@repo/validation`, `@repo/hooks`, `@repo/ui`, `backend` (for types)
- Relative imports within same app

**Biome Config** (linting/formatting):
- Indent: Tabs (width 4)
- Quotes: Double quotes
- Complex rules enforced: no banned types, unused imports as warnings, exhaustive dependencies as info
- No console logs except: warn, error, time, timeEnd
- JSDoc required for ambiguous code

## Development Workflow

1. **Start dev servers:** `bun run dev` (runs all apps in parallel)
2. **Write code** following conventions above
3. **Type check:** `bun run check` (run before committing)
4. **Lint/format:** `bun run lint` / `bun run format`
5. **Test (backend):** `bun test` (from apps/backend)
6. **Build:** `bun run build` (all apps, runs after type check)

## Database Workflow

**For schema changes:**
1. Edit table/relation in `apps/backend/src/drizzle/schema/[Model]Schema.ts`
2. Run `bun run db:generate` from backend to generate migration
3. Review generated migration in `migrations/` folder (read-only)
4. Run `bun run db:migrate` to apply migration
5. If initial data needed, add seeder in `drizzle/seeds/`

**Never:**
- Edit migration files manually
- Run raw SQL migrations
- Skip the Drizzle migration tool

## Important Notes

- **Migrations are auto-generated:** Drizzle generates them from schema changes. Do not edit `migrations/` folder.
- **Environment variables:** Backend uses `.env.local` for dev. Tests use `.env.test.local`. See `.env.example`.
- **OpenTelemetry:** Already integrated for observability. Metrics, traces, and logs exported to OTLP endpoint.
- **Email/SMS integrations:** Nodemailer for email. Check `appEnv.ts` for required env vars.
- **Monorepo caching:** Turborepo caches builds. Add `.env.*local` to `turbo.json` globalDependencies to bust cache on env changes.
- **No auto-migrations on startup:** Migrations must be run manually via `bun run db:prepare`.
- **Testing:** Backend has test suite. Frontend testing is minimal (focus on critical paths).
- **Rate limiting:** Global 1000 req/min/IP on protected routes. Adjust in `index.ts` if needed.
