# Dashboard Template Monorepo

A modern, full-stack monorepo template for rapid dashboard development. Powered by Turborepo, Bun, HonoJS (backend), React (frontend), Drizzle ORM, and a modular package structure.

---

## Project Structure

```
.
├── apps/
│   ├── backend/      # HonoJS backend (see apps/backend/README.md)
│   └── frontend/     # ReactJS frontend (see apps/frontend/README.md)
├── packages/
│   ├── data/         # Static data (e.g., permissions)
│   ├── hooks/        # Shared React hooks
│   ├── ui/           # Shadcn-based UI components
│   ├── validation/   # Zod validation schemas
│   └── typescript-config/ # Shared TS config
├── turbo.json        # Turborepo config
├── package.json      # Monorepo scripts/deps
└── bun.lock          # Bun lockfile
```

- **Monorepo:** Managed by [Turborepo](https://turbo.build/) and [Bun](https://bun.sh/).
- **Backend:** HonoJS, Drizzle ORM (PostgreSQL), strict schema/routing conventions ([see details](apps/backend/src/drizzle/README.md)).
- **Frontend:** React (Vite, Tanstack Router/Query), API via `honoClient` and `fetchRPC` utils.
- **Packages:** Modular, reusable code for UI, validation, data, hooks, and TS config.

---

## Quick Start

### 1. Clone the Repository

**SSH:**
```bash
git clone --single-branch git@github.com:sianida26/dashboard-template.git --origin template
```
**HTTPS:**
```bash
git clone --single-branch https://github.com/sianida26/dashboard-template.git --origin template
```

### 2. Switch to Main Branch

```bash
cd dashboard-template
git checkout main
```

### 3. Prevent Pushing to Template Remote

```bash
git remote set-url --push template no_push
```

---

## Development

- **Install dependencies:**
  ```bash
  bun install
  # or: pnpm install
  ```
- **Build all apps/packages:**
  ```bash
  bun run build
  # or: pnpm build
  ```
- **Run all apps/packages in dev mode:**
  ```bash
  bun run dev
  # or: pnpm dev
  ```

See [apps/backend/README.md](apps/backend/README.md) and [apps/frontend/README.md](apps/frontend/README.md) for app-specific setup and commands.

---

## Guidelines & Conventions

- **Backend:**
  - HonoJS, Drizzle ORM, PostgreSQL.
  - Schemas: `apps/backend/src/drizzle/schema/`
  - [Drizzle ORM rules & conventions](apps/backend/src/drizzle/README.md)
  - No direct migration file edits.
- **Frontend:**
  - React, Vite, Tanstack Router/Query.
  - Use `honoClient` and `fetchRPC` for API calls.
- **Packages:**
  - UI: Shadcn-based, Radix UI, TailwindCSS.
  - Validation: Zod schemas.
  - Data: Static/shared data.
  - Hooks: Shared React hooks.
- **TypeScript:** No `any` type, use `unknown` or specific types. Prefer null-coalescing (`??`).
- **Documentation:** JSDoc required for functions, schemas, and complex code.
- **Security:** Review all changes for vulnerabilities.
- **Do not auto-run migrations or dev servers.**

---

## References
- [apps/backend/README.md](apps/backend/README.md)
- [apps/backend/src/drizzle/README.md](apps/backend/src/drizzle/README.md)
- [apps/frontend/README.md](apps/frontend/README.md)
- [Project Guidelines (see .cursor/ or docs/ if present)]

---

## License
MIT (see individual package.json files for details)
