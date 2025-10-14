## Notifications Module

The notifications module introduces an end-to-end workflow covering storage, backend orchestration, and the dashboard experience.

### Database Artifacts

- `notifications` — primary record keyed by user ID with read/unread status, optional category, and JSON metadata.
- `notification_actions` — approval action catalogue attached to actionable notifications (e.g., approve/reject).
- `notification_action_logs` — immutable audit trail for actions, including actor ID, timestamp, and optional comment.

Each table is managed through Drizzle migrations (`0010_tired_lady_ursula.sql`) and surfaced via typed helpers in `apps/backend/src/drizzle/schema/notifications.ts`. Seeder data lives in `apps/backend/src/drizzle/seeds/notifications.ts`.

### Backend Services

- **Notification Repository** (`apps/backend/src/modules/notifications/notification-repository.ts`) — CRUD, cursor-friendly listing, unread counts, and action logging with transaction safety.
- **Notification Orchestrator** (`apps/backend/src/modules/notifications/notification-orchestrator.ts`) — high-level API for creating notifications, grouping responses, toggling states, and executing approval actions.
- **Notification Event Hub** (`apps/backend/src/lib/event-bus/notification-event-hub.ts`) — typed `EventEmitter` façade emitting `created`, `read`, and `actioned` lifecycle hooks for downstream integrations.

### REST Endpoints

Located at `apps/backend/src/routes/notifications/route.ts` and mounted under `/notifications`:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notifications` | Returns grouped notifications for the authenticated user. Accepts `status`, `type`, `before`, `after`, `cursor`, and `limit` query params. |
| `GET` | `/notifications/unread/count` | Lightweight unread counter used for the bell badge in the dashboard header. |
| `POST` | `/notifications/read` | Bulk toggle of read/unread state. |
| `POST` | `/notifications/:id/read` | Single notification toggle. |
| `POST` | `/notifications/:id/actions/:actionKey` | Executes an approval action, enforcing comment requirements when configured. |
| `POST` | `/notifications` | Internal seeding endpoint (super-admin only, flagged with `AI-FOLLOWUP` to scope further). |

Validation contracts live in `packages/validation/src/schemas/notifications.ts` and are re-used across backend + frontend.

### Tests

- Repository coverage: `apps/backend/tests/notifications/notification-repository.test.ts`.
- Orchestrator coverage: `apps/backend/tests/notifications/notification-orchestrator.test.ts`.
- Route coverage: `apps/backend/tests/routes/notifications.spec.ts`.
- Shared validation snapshots: `packages/validation/src/schemas/__tests__/notifications.test.ts`.

> **Note:** automated tests rely on a Postgres instance. Use `bun test --env-file .env.test --preload ./src/test-preload.ts` from `apps/backend` after configuring `TEST_DATABASE_URL`.

### Frontend Experience

- Route: `/notifications` (`apps/frontend/src/routes/_dashboardLayout/notifications/index.tsx`).
- Header bell badge wired through `fetchUnreadCount` and shared query keys (`apps/frontend/src/modules/notifications/queryKeys.ts`).
- API helpers: `apps/frontend/src/modules/notifications/api.ts`.
- Types: `apps/frontend/src/modules/notifications/types.ts`.

The interface is tuned for non-technical teammates:

- Familiar mail-style layout with the inbox list on the left and message details on the right, plus top-level filters/actions.
- Friendly filter presets (“All updates”, “Unopened”, “Needs decision”, “Friendly updates”) described in plain language.
- An inbox sidebar that highlights unread entries and offers a one-click “Mark everything as read”.
- A conversational detail panel that replaces technical metadata with approachable labels and helper copy.
- Technical metadata stays available behind a developer-only toggle so forks can still programmatically consume it without cluttering the main UI.
- Approval actions surfaced as clear call-to-action buttons with optional note-taking for context.
- Previous choices are summarised in everyday language, keeping the workflow transparent without overwhelming details.
