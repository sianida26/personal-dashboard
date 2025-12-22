# Notification System

## Table of Contents

- [Notification System](#notification-system)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Main Concept](#main-concept)
    - [Architecture](#architecture)
    - [Core Components](#core-components)
    - [User Preference Hierarchy](#user-preference-hierarchy)
  - [Flow Diagrams](#flow-diagrams)
    - [Notification Dispatch Flow](#notification-dispatch-flow)
    - [Channel Delivery Flow](#channel-delivery-flow)
    - [Real-Time SSE Flow](#real-time-sse-flow)
    - [Approval Action Flow](#approval-action-flow)
  - [Database Schema](#database-schema)
  - [Example Usage](#example-usage)
    - [Basic Notifications](#basic-notifications)
    - [Approval Workflows](#approval-workflows)
    - [API Endpoints](#api-endpoints)
  - [Important Notes](#important-notes)
    - [Email Configuration](#email-configuration)
    - [Environment Overrides](#environment-overrides)
    - [Job Handler Configuration](#job-handler-configuration)
    - [WhatsApp Configuration](#whatsapp-configuration)
    - [Gotchas](#gotchas)
    - [Test Files](#test-files)
  - [Revision History](#revision-history)

---

## Overview

A type-safe, multi-channel notification system supporting:

| Channel | Description |
|---------|-------------|
| **In-App** | Database-stored notifications with real-time SSE delivery and browser push |
| **Email** | Async email delivery via job queue. Sent to user's email address from `users.email` field |
| **WhatsApp** | Async WhatsApp messaging via job queue. **Supports WAHA API only**. Phone number retrieved from: 1) `channelOverrides.whatsapp.phoneNumber`, 2) `request.metadata.phoneNumber`, 3) `request.metadata.contactPhone`, 4) `recipient.phoneNumber` (from `users.phoneNumber` field) |

Key capabilities:
- **Real-time delivery** via Server-Sent Events (SSE)
- **User preference-aware** routing per category/channel
- **Approval workflows** with actionable buttons and comments
- **Async processing** via job queue for external channels

**User Settings**: Users can configure notification preferences (enable/disable channels per category) at: `/_dashboardLayout/personal/notifications`

---

## Main Concept

### Architecture

```mermaid
flowchart TB
    subgraph Application["Application Layer"]
        Routes["Route Handlers<br/>👉 INVOKE FROM HERE"]
        Services["Services<br/>👉 INVOKE FROM HERE"]
    end

    subgraph Helpers["Helper Functions"]
        STR["sendToRoles()"]
        STU["sendToUsers()"]
        STUR["sendToUsersAndRoles()"]
    end

    subgraph Core["Unified Notification Service"]
        Resolve["Resolve Audience"]
        Prefs["Check Preferences"]
        Dispatch["Dispatch to Channels"]
    end

    subgraph Adapters["Channel Adapters"]
        InApp["InAppChannelAdapter"]
        Email["EmailChannelAdapter"]
        WhatsApp["WhatsAppChannelAdapter"]
    end

    subgraph Queue["Job Queue"]
        JQ["Job Queue Manager"]
        subgraph Handlers["Job Handlers"]
            H1["in-app-notification"]
            H2["email-notification"]
            H3["whatsapp-notification"]
        end
    end

    subgraph Delivery["Delivery Layer"]
        DB[(Database)]
        EmailSvc["Email Service"]
        WASvc["WhatsApp Service"]
        EventHub["Notification Event Hub"]
    end

    subgraph Client["Frontend"]
        SSE["SSE Stream"]
        UI["Notification UI"]
    end

    Routes --> STR & STU & STUR
    Services --> STR & STU & STUR
    STR & STU & STUR --> Resolve
    Resolve --> Prefs
    Prefs --> Dispatch
    Dispatch --> InApp & Email & WhatsApp
    InApp & Email & WhatsApp --> JQ
    JQ --> Handlers
    H1 --> DB
    H1 --> EventHub
    H2 --> EmailSvc
    H3 --> WASvc
    EventHub --> SSE
    SSE --> UI
```

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Helper Functions** | `src/utils/notifications/notification-helpers.ts` | Simple wrappers for common notification patterns |
| **Unified Service** | `src/modules/notifications/unified-notification-service.ts` | Orchestrates audience resolution, preference filtering, channel dispatch |
| **Channel Adapters** | `src/modules/notifications/channels/` | Channel-specific job creation (InApp, Email, WhatsApp) |
| **Job Handlers** | `src/jobs/handlers/` | Async processors for each notification type |
| **Repository** | `src/modules/notifications/notification-repository.ts` | Database CRUD operations |
| **Event Hub** | `src/lib/event-bus/notification-event-hub.ts` | Real-time event emission for SSE |

### User Preference Hierarchy

The system respects user preferences with this precedence:

```mermaid
flowchart TD
    A["Check Global Preference"] --> B{Global Enabled?}
    B -->|No| Skip["Skip Channel"]
    B -->|Yes| C{Category Preference Exists?}
    C -->|Yes| D{Category Enabled?}
    D -->|Yes| Send["Send Notification"]
    D -->|No| Skip
    C -->|No| E["Use Default Matrix"]
    E --> Send
```

1. **Global preference** acts as master switch per channel
2. **Category-specific preference** overrides defaults if set
3. **Default matrix** fallback from system constants

---

## Flow Diagrams

### Notification Dispatch Flow

```mermaid
sequenceDiagram
    participant App as Application Code
    participant Helper as Helper Function
    participant UNS as UnifiedNotificationService
    participant Repo as NotificationRepository
    participant Adapter as Channel Adapter
    participant Queue as Job Queue

    App->>Helper: sendToRoles(["admin"], options)
    Helper->>UNS: send(request)
    
    Note over UNS: 1. Resolve Channels
    UNS->>UNS: normalizeChannels()
    
    Note over UNS: 2. Resolve Audience
    UNS->>Repo: findUserIdsByRoleCodes()
    Repo-->>UNS: userIds[]
    
    Note over UNS: 3. Fetch Recipients
    UNS->>Repo: getUserDetails()
    Repo-->>UNS: recipients[]
    
    Note over UNS: 4. For Each Channel
    loop Per Channel
        UNS->>UNS: partitionByPreference()
        UNS->>Adapter: deliver(allowedRecipients)
        Adapter->>Queue: enqueue(job)
        Queue-->>Adapter: jobId
        Adapter-->>UNS: ChannelDispatchResult[]
    end
    
    UNS-->>Helper: NotificationDispatchResult
    Helper-->>App: results[]
```

### Channel Delivery Flow

```mermaid
flowchart LR
    subgraph InApp["In-App Channel"]
        IA1["Create Job"] --> IA2["Job Handler"]
        IA2 --> IA3["Insert to DB"]
        IA3 --> IA4["Emit 'created' Event"]
        IA4 --> IA5["SSE to Client"]
    end

    subgraph Email["Email Channel"]
        E1["Create Job"] --> E2["Job Handler"]
        E2 --> E3["Build HTML Template"]
        E3 --> E4["Send via EmailService"]
    end

    subgraph WhatsApp["WhatsApp Channel"]
        W1["Create Job"] --> W2["Job Handler"]
        W2 --> W3["Resolve Phone Number"]
        W3 --> W4["Send via WhatsAppService"]
    end
```

### Real-Time SSE Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant SSE as SSE Endpoint
    participant Hub as NotificationEventHub
    participant Handler as InAppHandler

    Client->>SSE: GET /api/notifications/stream
    SSE->>Hub: subscribeUserCreated(userId)
    
    Note over Handler: New notification processed
    Handler->>Hub: emit('created', notification)
    Hub->>SSE: callback(notification)
    SSE->>Client: event: notification\ndata: {...}
    
    Note over Client: Display notification in UI
```

### Approval Action Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Notification UI
    participant API as API Route
    participant Orch as Orchestrator
    participant Repo as Repository
    participant Hub as EventHub

    User->>UI: Click "Approve" button
    UI->>API: POST /notifications/:id/actions/approve
    API->>Orch: executeAction(id, actionKey, comment)
    
    Orch->>Repo: getNotificationById(id)
    Repo-->>Orch: notification with actions
    
    Note over Orch: Validate action exists
    
    Orch->>Repo: recordActionLog()
    Orch->>Repo: markNotifications([id], "read")
    Orch->>Hub: emit('actioned', actionLog)
    
    Hub-->>UI: SSE event
    Orch-->>API: actionLog
    API-->>UI: 200 OK
    UI->>User: Show success
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ notifications : receives
    users ||--o{ userNotificationPreferences : configures
    users ||--o{ notificationActionLogs : performs
    notifications ||--o{ notificationActions : has
    notifications ||--o{ notificationActionLogs : logs

    notifications {
        varchar id PK "CUID, 25 chars"
        text userId FK "references users.id"
        enum type "informational | approval"
        text title "required"
        text message "required"
        enum status "unread | read"
        varchar category "50 chars"
        jsonb metadata "arbitrary JSON"
        timestamp createdAt
        timestamp readAt "nullable"
        timestamp expiresAt "nullable"
        date groupKey "for grouping"
    }

    notificationActions {
        varchar id PK "CUID, 25 chars"
        varchar notificationId FK
        varchar actionKey "50 chars"
        varchar label "100 chars"
        boolean requiresComment "default false"
        timestamp createdAt
    }

    notificationActionLogs {
        varchar id PK "CUID, 25 chars"
        varchar notificationId FK
        varchar actionKey "50 chars"
        text actedBy FK "references users.id"
        text comment "nullable"
        timestamp actedAt
    }

    userNotificationPreferences {
        varchar id PK "CUID, 25 chars"
        text userId FK "references users.id"
        enum category "global | general | system"
        enum channel "inApp | email | whatsapp"
        boolean enabled "default true"
        jsonb deliveryWindow "nullable"
        enum source "default | user | override"
        timestamp createdAt
        timestamp updatedAt
    }
```

**Indexes:**
- `notifications`: `(userId, status)`, `(userId, groupKey)`, `(userId, createdAt DESC)`
- `userNotificationPreferences`: unique `(userId, category, channel)`

---

## Example Usage

### Basic Notifications

```typescript
import { sendToRoles, sendToUsers, sendToUsersAndRoles } from "../../utils/notifications/notification-helpers";

// Send to specific roles
await sendToRoles(["admin", "manager"], {
  type: "informational",
  title: "Scheduled Maintenance",
  message: "System will be down for 2 hours tonight at 10 PM",
  category: "system",
  channels: ["inApp", "email"],
});

// Send to specific users
await sendToUsers([newUser.id], {
  type: "informational",
  title: "Welcome!",
  message: "Your account has been created.",
  category: "users",
  metadata: { userId: newUser.id },
});

// Bypass preferences for critical alerts
await sendToRoles(["admin"], {
  type: "informational",
  title: "CRITICAL: System Error",
  message: "Database connection lost",
  category: "system",
  respectPreferences: false,
});
```

### Approval Workflows

```typescript
await sendToRoles(["finance"], {
  type: "approval",
  title: "Order Approval Required",
  message: `Order #${orderId} for $${amount} needs approval`,
  category: "orders",
  actions: [
    { actionKey: "approve", label: "Approve", requiresComment: false },
    { actionKey: "reject", label: "Reject", requiresComment: true },
  ],
  metadata: { orderId, amount },
});
```

**Response structure:**

```typescript
{
  results: [
    {
      userId: "user-123",
      channel: "inApp",
      status: "scheduled", // or "sent", "skipped", "failed"
      jobId: "job-456",
      reason?: "Channel disabled by user preference"
    }
  ]
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/notifications` | List | Query with filters: `status`, `type`, `category`, `cursor` |
| `GET /api/notifications/unread/count` | Count | Get unread count for current user |
| `GET /api/notifications/stream` | SSE | Real-time notification stream |
| `POST /api/notifications/read` | Bulk Mark | Mark multiple notifications read/unread |
| `POST /api/notifications/:id/read` | Single Mark | Mark single notification read/unread |
| `POST /api/notifications/:id/actions/:actionKey` | Action | Execute approval action |
| `POST /api/notifications` | Create | Admin-only: dispatch new notification |

**List response with grouping:**

```typescript
{
  items: [...],
  groups: [
    { key: "today", title: "Today", notifications: [...] },
    { key: "yesterday", title: "Yesterday", notifications: [...] },
    { key: "thisWeek", title: "This Week", notifications: [...] },
    { key: "earlier", title: "Earlier", notifications: [...] }
  ],
  nextCursor: "2024-11-01T10:00:00Z"
}
```

---

## Important Notes

### Email Configuration

Email notifications require SMTP configuration:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587  # 465 for secure, 587 for TLS
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM_NAME=Dashboard  # Optional, defaults to "Dashboard"
SMTP_FROM_EMAIL=noreply@example.com  # Optional, defaults to SMTP_USER
```

**Recipient Email**: Notifications are sent to the user's email from `users.email` field in the database.

### Environment Overrides

For testing/development, email and WhatsApp channels can be overridden:

```bash
NOTIFICATION_OVERRIDE_EMAIL=test@example.com
NOTIFICATION_OVERRIDE_PHONE=+628123456789
```

**Note**: These overrides redirect ALL notifications to the specified addresses, regardless of the actual recipient.

### Job Handler Configuration

| Handler | Max Retries | Timeout |
|---------|-------------|---------|
| `in-app-notification` | 3 | 30s |
| `email-notification` | 3 | 30s |
| `whatsapp-notification` | 3 | 30s |

### WhatsApp Configuration

WhatsApp notifications use the **WAHA (WhatsApp HTTP API)** service:

```bash
WAHA_API_KEY=your-api-key
WAHA_BASE_URL=https://waha.dsg.id  # Optional, defaults to this
WAHA_SESSION=default  # Optional, defaults to "default"
```

**Phone Number Resolution Priority**:
1. `channelOverrides.whatsapp.phoneNumber` - Highest priority
2. `channelOverrides.whatsapp.metadata.phoneNumber`
3. `request.metadata.phoneNumber`
4. `request.metadata.contactPhone`
5. `recipient.phoneNumber` (from `users.phoneNumber` field) - Lowest priority

**Phone Number Normalization**: The service automatically formats Indonesian numbers (adds `62` prefix if missing).

### Gotchas

1. **WhatsApp requires WAHA API key** - Set `WAHA_API_KEY` in environment
2. **Email collects unique addresses** - Sends one job per batch, not per recipient
3. **In-App creates one job per recipient** - Ensures proper user isolation
4. **SSE uses setMaxListeners(0)** - Supports unlimited concurrent subscribers
5. **Duplicate notification IDs** - Repository uses `ON CONFLICT DO NOTHING` to handle
6. **Phone numbers auto-normalized** - Indonesian numbers get `62` prefix if missing

### Test Files

- `tests/notifications/notification-orchestrator.test.ts`
- `tests/notifications/unified-notification-service.test.ts`
- `tests/routes/notifications.spec.ts`

Run with: `bun test apps/backend/tests/notifications/`

---

## Revision History

| Version | Date | Summary of Change |
|---------|------|-------------------|
| 2 | 2024-12-22 | Restructured documentation with flow diagrams and ERD |
| 1 | 2024-11-01 | Initial documentation |
