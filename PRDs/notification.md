# Notification System - PRD

## Overview
This document specifies the in-app notification system for the dashboard template. The feature delivers a dedicated notification experience similar to GitHub notifications, supports read/unread toggling, distinguishes informational versus approval notifications, groups entries by date, and exposes integration points so downstream forks or companion apps can consume the same event stream. The module spans the HonoJS + Drizzle + PostgreSQL backend and the React dashboard front-end, following existing conventions.

## 1. Purpose and Scope

### 1.1 Objectives
- Provide a persistent notification pipeline tightly integrated with existing user/session models.
- Offer a GitHub-like notification page within the dashboard template, including read/unread toggles and bulk actions.
- Support two first-class notification categories: informational (no action required) and approval (actionable with multiple decisions).
- Emit notification events via an observer layer that can evolve into an SDK for external dashboard apps.
- Enable chronological grouping (e.g., Today, Yesterday, Earlier) to simplify scanning.
- Maintain parity with existing project patterns for code organization, theming, and API design.

### 1.2 Target Use Cases
- Workflow updates such as completed jobs, imports, or scheduled runs.
- Approval requests requiring reviewer decisions within the dashboard.
- System-wide announcements or maintenance notices.
- Third-party integrations pushing status updates into the dashboard.
- Audit and compliance tracking for actions taken on approval notifications.

## 2. Technical Architecture

### 2.1 Core Components

#### 2.1.1 Notification Orchestrator
- **Location**: `apps/backend/src/modules/notifications/notification-orchestrator.ts`
- **Responsibilities**:
  - Create notifications from domain events or direct service calls.
  - Route notifications to channels (in-app initially, extensible to email/webhooks).
  - Coordinate read/unread state transitions and group updates.

#### 2.1.2 Notification Repository
- **Location**: `apps/backend/src/modules/notifications/notification-repository.ts`
- **Responsibilities**:
  - CRUD operations via Drizzle on notification tables.
  - Projection queries (pagination, filtering, grouping).
  - Soft deletion and archival policies.

#### 2.1.3 Notification Event Hub
- **Location**: `apps/backend/src/lib/event-bus/notification-event-hub.ts`
- **Responsibilities**:
  - Wrap the existing event emitter (Node `EventEmitter` or project bus) with typed topics.
  - Broadcast notification lifecycle events (`created`, `read`, `actioned`).
  - Power an optional SDK (`packages/notification-sdk`) for external consumers.

#### 2.1.4 Notification Action Handlers
- **Location**: `apps/backend/src/modules/notifications/actions/`
- **Responsibilities**:
  - Define server-side logic for approval action options (approve, reject, request-changes, etc.).
  - Validate permissions before state transitions.
  - Emit follow-up events (e.g., job queue entries) when actions are executed.

#### 2.1.5 Notification UI Module
- **Location**: `apps/frontend/src/routes/_dashboardLayout/notifications/`
- **Responsibilities**:
  - Dedicated route directory (`/notifications`) mirroring GitHub UX with list pane, filters, and detail preview.
  - React query hooks leveraging `@tanstack/react-query` or existing data layer.
  - State controls for read/unread toggles and grouped rendering.

#### 2.1.6 Notification SDK (Optional Extension)
- **Location**: `packages/notification-sdk/`
- **Responsibilities**:
  - Provide a typed client for the event hub using SSE/WebSocket/HTTP polling.
  - Offer helper methods to embed notifications in downstream dashboards.
  - Remain optional but documented for fork implementations.

### 2.2 Event Flow Architecture

#### Option A: Inline Event Bus (Recommended)
- Utilizes a shared event bus within the main backend process.
- Simplifies integration with existing modules and reduces infrastructure overhead.
- Provides synchronous hooks for immediate notification creation.

#### Option B: External Message Broker
- Uses Redis streams or NATS for decoupled processing.
- Facilitates scaling independent notification workers.
- More complex deployment; useful for high-throughput forks.

**Decision**: Adopt Option A for the template. Design interfaces so Option B can be enabled via adapter classes without refactoring downstream consumers.

### 2.3 Data Flow
1. Domain service raises an event (e.g., job completed).
2. Notification Orchestrator maps the event to notification payload and type.
3. Repository persists the notification records and associated actions.
4. Event Hub emits `notification.created` for UI and SDK listeners.
5. Front-end lists notifications grouped by date; user toggles read/unread via API.
6. For approval notifications, user triggers an action; backend validates, persists outcome, and emits `notification.actioned`.

## 3. Database Design

### 3.1 Tables

#### 3.1.1 `notifications`
```sql
CREATE TABLE notifications (
    id VARCHAR(25) PRIMARY KEY,                     -- CUID2
    user_id VARCHAR(25) NOT NULL,                   -- Recipient
    type VARCHAR(50) NOT NULL,                      -- informational | approval
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,    -- Context payload
    status VARCHAR(20) NOT NULL DEFAULT 'unread',   -- unread | read
    category VARCHAR(50),                           -- Optional high-level tag
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    group_key DATE GENERATED ALWAYS AS (created_at::DATE) STORED
);

CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_group_key ON notifications(user_id, group_key DESC);
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);
```

#### 3.1.2 `notification_actions`
```sql
CREATE TABLE notification_actions (
    id VARCHAR(25) PRIMARY KEY,
    notification_id VARCHAR(25) NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    action_key VARCHAR(50) NOT NULL,        -- approve | reject | etc.
    label VARCHAR(100) NOT NULL,
    requires_comment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_actions_notification_id ON notification_actions(notification_id);
```

#### 3.1.3 `notification_action_logs`
```sql
CREATE TABLE notification_action_logs (
    id VARCHAR(25) PRIMARY KEY,
    notification_id VARCHAR(25) NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    action_key VARCHAR(50) NOT NULL,
    acted_by VARCHAR(25) NOT NULL,
    comment TEXT,
    acted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_action_logs_notification_id ON notification_action_logs(notification_id);
```

## 4. API Design

### 4.1 REST Endpoints (HonoJS)
- `GET /api/notifications` – List notifications with filters (`status`, `type`, `before`, `after`, `cursor`). Supports grouped response keyed by `group_key`.
- `POST /api/notifications/read` – Bulk mark notifications as read/unread.
- `POST /api/notifications/:id/read` – Toggle read state for a single notification.
- `POST /api/notifications/:id/actions/:actionKey` – Execute an approval action with optional comment payload.
- `GET /api/notifications/unread/count` – Return unread badge count.
- `POST /api/notifications` – Service-to-service endpoint for seeding notifications (protected by internal auth).

### 4.2 WebSocket / SSE Channel (Phase 2 Optional)
- `GET /api/notifications/stream` – Streams `notification.created` and `notification.actioned` events.
- Integrates with Notification SDK to update UI without polling.

### 4.3 Request/Response Contracts
- Use existing `zod` schemas under `apps/backend/src/schemas/notifications.ts`.
- Enforce read/unread toggle payload: `{ ids: string[], markAs: 'read' | 'unread' }`.
- Approval action payload: `{ comment?: string }`.

## 5. Front-end Experience

### 5.1 Page Layout (`/notifications`)
- Split view similar to GitHub:
  - Left column: filters (All, Unread, Approvals, Informational) and group headers by date (Today, Yesterday, This Week, Earlier).
  - Right column: detail pane with description, metadata, action buttons for approval notifications.
- Persistent unread badge in main navigation referencing unread count endpoint.

### 5.2 Interactions
- Checkbox selection to bulk mark as read/unread.
- Single-click toggles read state; keyboard shortcuts mirroring list navigation patterns (optional future).
- Approval notifications display action buttons; disabled once action taken.
- Info notification detail may include deep links (open in new tab).

### 5.3 State Management
- Use the existing React Query instance defined in `apps/frontend/src/App.tsx`.
- Local optimistic updates for read/unread toggles.
- Cache invalidation when actions succeed.
- Shared date grouping utility should live under `apps/frontend/src/utils/` (e.g., `groupByDate.ts`) alongside other helpers.

### 5.4 Accessibility
- Ensure focus management when toggling read state.
- Use ARIA roles (`role="list"`, `aria-live="polite"`) for real-time updates.
- Provide text labels for action buttons and grouping headers.

## 6. Event and Observer Strategy

- Implement `NotificationEventHub` extending the project emitter with typed methods:
  ```ts
  notificationEvents.emit('created', payload);
  notificationEvents.on('created', handler);
  ```
- Provide adapter for other transports (Redis, message queue) when forks require distributed events.
- Document event contract in `packages/notification-sdk/README.md`.
- Encourage dashboard forks to consume the hub for cross-app synchronization (e.g., electron app).

## 7. Integration with Existing Modules

- Hook into authentication to scope notifications to `user_id`.
- Leverage existing `apps/backend/src/lib/audit` for logging approval decisions.
- Optionally register approval actions to feed the background job queue when tasks need asynchronous handling.
- Align styling with the component library in `apps/frontend/src/components/`, reusing primitives (Badge, List, Avatar, Button) and shared styles.
- Follow backend error handling conventions (`createAppResponse` helpers).

## 8. Permissions and Security

- Only authenticated users can access their notifications; administrators can query for audit via scoped endpoints.
- Approval actions require `approver` role check; unauthorized attempts return 403.
- Prevent action replay by checking notification status before executing.
- Limit payload to avoid HTML injection; render message body using sanitized Markdown if needed.
- Track action logs for compliance.

## 9. Performance and Scalability

- Index `notifications` by `(user_id, status, created_at)` to support paginated queries.
- Paginate API responses with cursor-based pagination (CUID2 or timestamp) to avoid heavy offsets.
- Cache unread counts in Redis (optional) with invalidation via event hub.
- Limit initial list to latest 50 per group; lazy load older groups.
- Consider background pruning for expired notifications (leveraging job queue module).

## 10. Testing Strategy

### 10.1 Unit Tests
- Repository operations (create, mark read, fetch grouped).
- Event hub emitter and listener registration.
- Approval action handlers for permission checks.

### 10.2 Integration Tests
- End-to-end flow: create notification -> fetch -> mark read -> action -> audit log.
- API response grouping and pagination.
- Optional SSE/WebSocket stream handshake.

### 10.3 Front-end Tests
- Component rendering with grouped lists.
- Read/unread toggle interactions (React Testing Library).
- Approval action submission flow.

### 10.4 Manual QA
- Cross-browser verification of dedicated page.
- Accessibility keyboard navigation and screen reader behavior.
- Performance sanity checks on large notification sets.

## 11. Metrics and Observability

- Emit structured logs for notification creation and action completion.
- Capture metrics: unread count per user, approval completion latency, notification creation volume.
- Integrate with existing monitoring (e.g., OpenTelemetry traces) for timeline of event-to-UI latency.
- Send alerts if notification creation fails or event hub queue backs up.

## 12. Rollout Plan

1. **Backend foundation**: database migrations, repository, orchestrator, event hub skeleton.
2. **API layer**: REST endpoints with authorization and validation.
3. **Front-end MVP**: notification list with grouping, read/unread toggle, detail panel.
4. **Approval actions**: action buttons, backend handlers, audit logging.
5. **Event streaming** (optional): SSE endpoint, React live updates.
6. **SDK draft** (optional): initial package exposing subscription helpers.
7. **Polish**: accessibility, empty states, performance tuning.

## 13. Risks and Mitigations

- **Notification fatigue**: Introduce categories and filters; allow user preferences in future iterations.
- **Permission leakage**: Strict backend checks and audit logging for actions.
- **Scaling event listeners**: Keep event hub lightweight; evaluate external broker when concurrency increases.
- **UI clutter**: Adhere to design system spacing and virtualization if lists grow large.
- **Data retention**: Define retention policy; schedule cleanup via job queue integration.

## 14. Success Metrics

- Unread notification count accuracy: ≥ 99%.
- Time from event emission to UI availability: ≤ 3 seconds (inline bus).
- Approval action completion rate: ≥ 95% within SLA.
- Front-end render performance: List interaction under 16ms frame budget.
- Developer integration score: Onboarding doc enabling new fork to emit notifications within 1 hour.

## 15. Future Enhancements

- User preferences for notification channels and categories.
- Rich media support (avatars, attachments).
- Cross-device sync leveraging push notifications.
- Advanced search and saved filters.
- Batch approvals and escalation workflows.

## 16. Conclusion

The notification module delivers a first-class in-app communication surface tightly coupled with the dashboard template. It respects existing project patterns, provides extensible observer hooks, and prepares the groundwork for fork-specific SDK integrations. By shipping the dedicated page, read/unread toggles, approval workflows, and event infrastructure, the dashboard template can power real-world scenarios without heavy customization.
