# Notification System Documentation

## Overview

This is a minimal, type-safe notification system with support for multiple delivery channels:

- **In-App Notifications**: Displayed in application inbox and browser native push notifications
- **Email**: Email delivery (configurable)
- **WhatsApp**: WhatsApp messaging (configurable)

All notifications are real-time, preference-aware, and support approval workflows.

---

## Quick Start

Use the helper functions to send notifications from anywhere in your application:

```typescript
import { sendToRoles, sendToUsers, sendToUsersAndRoles } from "../../utils/notifications/notification-helpers";

// Send to specific roles
await sendToRoles(["admin"], {
  type: "informational",
  title: "System Update",
  message: "A system update has been deployed",
  category: "system",
  channels: ["inApp", "email"],
  metadata: { version: "1.2.0" },
});

// Send to specific users
await sendToUsers(["user-123", "user-456"], {
  type: "informational",
  title: "Welcome",
  message: "Welcome to the platform!",
  category: "users",
});

// Send to both users and roles
await sendToUsersAndRoles({
  userIds: ["user-123"],
  roleCodes: ["manager"],
  type: "approval",
  title: "Action Required",
  message: "Please review and approve this request",
  category: "system",
  channels: ["inApp"],
  actions: [
    { actionKey: "approve", label: "Approve", requiresComment: false },
    { actionKey: "reject", label: "Reject", requiresComment: true },
  ],
});
```

### API Response
```typescript
{
  results: [
    {
      userId: "user-123",
      channel: "inApp",
      status: "scheduled", // or "sent", "skipped", "failed"
      jobId: "job-456",    // present if queued
      reason?: "Channel disabled by user preference"
    }
  ]
}
```

---

## Features

### Multi-Channel Support
Notifications automatically route to enabled channels based on user preferences:

- **In-App**: Stored in database, delivered via real-time SSE stream, includes browser native push notifications
- **Email**: Queued for email service delivery
- **WhatsApp**: Queued for WhatsApp service delivery

### User Preferences
Users can control notifications at the category + channel level:

```typescript
// Categories: any string (recommended: "users", "system", "orders", etc.)
// Channels: "inApp" | "email" | "whatsapp"
// Note: inApp includes browser native push notifications
```

Users manage preferences in the UI at: `/personal/notifications`

### Approval Notifications
Notifications can include actionable buttons:

```typescript
{
  type: "approval",
  title: "Review Request",
  message: "Please review this submission",
  actions: [
    {
      actionKey: "approve",
      label: "Approve",
      requiresComment: false, // optional comment input
    },
    {
      actionKey: "reject",
      label: "Reject",
      requiresComment: true, // comment is required
    },
  ],
}
```

Users can execute actions from the UI. Actions are logged and notifications auto-mark as read.

### Real-Time Delivery
Notifications are delivered in real-time via Server-Sent Events (SSE):

- Frontend connects to `GET /api/notifications/stream`
- New notifications appear instantly in the UI
- Graceful reconnection on network failure

### Preference Checking
Notifications respect user preferences:

```typescript
// Only send if user has enabled the channel for this category
respectPreferences: true, // default

// Force delivery regardless of preferences (admin/critical)
respectPreferences: false,
```

---

## Architecture

```
┌─────────────────────────────────────┐
│  Application Code                   │
│  (Route Handler, Service, etc.)     │
└────────────────┬────────────────────┘
                 │
                 v
┌─────────────────────────────────────┐
│  Helper Functions                   │
│  sendToRoles(), sendToUsers()       │
└────────────────┬────────────────────┘
                 │
                 v
┌─────────────────────────────────────┐
│  UnifiedNotificationService         │
│  - Resolves audience (users + roles)│
│  - Filters by preferences           │
│  - Routes to channel adapters       │
└────────────────┬────────────────────┘
                 │
         ┌───────┼───────┬───────────┐
         v       v       v           v
    ┌─────────┐ ┌───────┐ ┌────────┐
    │In-App   │ │Email  │ │WhatsApp│
    │Adapter  │ │Adapter│ │Adapter │
    └────┬────┘ └───┬───┘ └───┬────┘
         │          │         │
         v          v         v
    ┌─────────┐ ┌─────────────────┐
    │  DB     │ │  Job Queue      │
    │Store    │ │  (async tasks)  │
    └─────────┘ └─────────────────┘
         │              │
         v              v
    ┌─────────────────────────────┐
    │  Job Handlers               │
    │ - in-app-notification       │
    │ - email-notification        │
    │ - whatsapp-notification     │
    └─────────────────────────────┘
         │
         v
    ┌─────────────────────────────┐
    │  Delivery                   │
    │ (Database, Email, WhatsApp) │
    └─────────────────────────────┘
```

---

## Core Components

### 1. Helper Functions

**Location**: `src/utils/notifications/notification-helpers.ts`

- `sendToRoles(roleCodes, options)` - Send to role-based recipients
- `sendToUsers(userIds, options)` - Send to specific users
- `sendToUsersAndRoles(options)` - Send to users and/or roles

All helpers use the unified notification service under the hood.

### 2. Unified Notification Service

**Location**: `src/modules/notifications/unified-notification-service.ts`

Orchestrates the complete notification workflow:

1. **Audience Resolution**: Converts userIds + roleCodes to actual user list
2. **Preference Filtering**: Partitions recipients by channel preference
3. **Channel Dispatch**: Routes to appropriate channel adapter
4. **Result Aggregation**: Returns delivery status for each recipient

### 3. Channel Adapters

**Location**: `src/modules/notifications/channels/`

Each channel implements the same interface:

- **InAppChannelAdapter**: Queues in-app-notification job
- **EmailChannelAdapter**: Queues email-notification job
- **WhatsAppChannelAdapter**: Queues whatsapp-notification job

Adapters return delivery status without blocking.

### 4. Job Queue & Handlers

**Location**: `src/jobs/handlers/` and `src/services/jobs/`

Background workers process notifications asynchronously:

- **in-app-notification**: Stores notifications in DB, emits events
- **email-notification**: Sends emails (mock implementation)
- **whatsapp-notification**: Sends WhatsApp messages (mock implementation)

### 5. Database Layer

**Location**: `src/modules/notifications/notification-repository.ts`

CRUD operations for notifications:

- `createNotification()` - Insert notification(s)
- `listNotificationsForUser()` - Query with pagination
- `markNotifications()` - Update read/unread status
- `recordActionLog()` - Log action execution
- `getNotificationById()` - Single fetch

### 6. Real-Time Events

**Location**: `src/lib/event-bus/notification-event-hub.ts`

Emits events for real-time UI updates:

- `created` - When notification is created
- `read` - When notification is marked read/unread
- `actioned` - When approval action is executed

---

## API Endpoints

### List Notifications

```
GET /api/notifications?status=unread&category=system&limit=20&cursor=<date>

Query Params:
  status: "read" | "unread" (optional)
  type: "informational" | "approval" (optional)
  category: string (optional)
  limit: 1-50 (default: 20)
  cursor: ISO date string (for pagination)

Response:
{
  items: [ /* notifications */ ],
  groups: [
    { key: "today", title: "Today", notifications: [...] },
    { key: "yesterday", title: "Yesterday", notifications: [...] },
    { key: "thisWeek", title: "This Week", notifications: [...] },
    { key: "earlier", title: "Earlier", notifications: [...] }
  ],
  nextCursor: "2024-11-01T10:00:00Z"
}
```

### Get Unread Count

```
GET /api/notifications/unread/count

Response:
{ count: 5 }
```

### Real-Time Stream (SSE)

```
GET /api/notifications/stream
Authorization: Bearer <token>

Events:
event: notification
data: { ...notification object... }
```

### Mark as Read (Bulk)

```
POST /api/notifications/read
{
  ids: ["notif-1", "notif-2"],
  markAs: "read" | "unread"
}

Response:
{ updated: 2, status: "read" }
```

### Mark as Read (Single)

```
POST /api/notifications/:id/read
{
  markAs: "read" | "unread"
}

Response:
{ updated: 1, status: "read" }
```

### Execute Approval Action

```
POST /api/notifications/:id/actions/:actionKey
{
  comment?: "optional comment if required by action"
}

Response:
{
  id: "log-123",
  notificationId: "notif-456",
  actionKey: "approve",
  actedBy: "user-123",
  comment: "Looks good",
  actedAt: "2024-11-02T15:30:00Z"
}
```

### Create Notification (Admin Only)

```
POST /api/notifications
{
  userId?: string,
  userIds?: string[],
  roleCodes?: string[],
  type: "informational" | "approval",
  title: string,
  message: string,
  category: string,
  channels?: ["inApp", "email", "whatsapp"],
  metadata?: { /* any JSON */ },
  actions?: [
    { actionKey: string, label: string, requiresComment?: boolean }
  ]
}

Response:
{
  message: "Notification sent successfully"
}
```

---

## Usage Examples

### Example 1: System Announcement

```typescript
// In a route handler
await sendToRoles(["admin", "manager"], {
  type: "informational",
  title: "Scheduled Maintenance",
  message: "System will be down for 2 hours tonight at 10 PM",
  category: "system",
  channels: ["inApp", "email"],
});
```

### Example 2: User Onboarding

```typescript
// In user creation route
await sendToUsers([newUser.id], {
  type: "informational",
  title: "Welcome!",
  message: "Your account has been created. Get started here.",
  category: "users",
  metadata: { userId: newUser.id },
});
```

### Example 3: Approval Workflow

```typescript
// In order creation route
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

### Example 4: Critical Alert

```typescript
// Bypass user preferences for critical alerts
await sendToRoles(["admin"], {
  type: "informational",
  title: "CRITICAL: System Error",
  message: "Database connection lost",
  category: "system",
  respectPreferences: false, // Force delivery
});
```

---

## Database Schema

### notifications table

```typescript
{
  id: string (CUID),
  userId: string (FK to users),
  type: "informational" | "approval",
  title: string,
  message: string,
  status: "unread" | "read",
  category: string,
  metadata: JSONB,
  expiresAt: timestamp nullable,
  createdAt: timestamp,
  readAt: timestamp nullable,
}

Indexes:
- (userId, status)
- (userId, createdAt DESC)
```

### notificationActions table

```typescript
{
  id: string (CUID),
  notificationId: string (FK to notifications),
  actionKey: string,
  label: string,
  requiresComment: boolean,
  createdAt: timestamp,
}
```

### notificationActionLogs table

```typescript
{
  id: string (CUID),
  notificationId: string (FK to notifications),
  actionKey: string,
  actedBy: string (FK to users),
  comment: string nullable,
  actedAt: timestamp,
}
```

### userNotificationPreferences table

```typescript
{
  id: string (CUID),
  userId: string (FK to users),
  category: string,
  channel: "inApp" | "email" | "whatsapp",
  enabled: boolean,
  updatedAt: timestamp,
}
```

---

## Frontend Integration

### Notification Center

Users can view and manage notifications at: `/_dashboardLayout/notifications`

Features:
- View all notifications grouped by date (Today, Yesterday, This Week, Earlier)
- Filter by status (All, Unread)
- Search notifications
- Mark as read/unread
- Execute approval actions with comments
- Pagination with cursor support

### Preferences Page

Users can configure notification settings at: `/_dashboardLayout/personal/notifications`

Features:
- Enable/disable channels per category
- See current preferences
- Save changes

### Real-Time Updates

Notifications appear in real-time via SSE:

```typescript
// Frontend automatically connects via NotificationProvider
// New notifications appear instantly without page refresh
```

---

## Testing

### Manual Testing

1. **Send a notification via API**:
   ```bash
   curl -X POST http://localhost:3000/api/notifications \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "roleCodes": ["admin"],
       "type": "informational",
       "title": "Test",
       "message": "This is a test",
       "category": "system"
     }'
   ```

2. **View in notification center**: Go to `/_dashboardLayout/notifications`

3. **Test real-time delivery**: Open UI in two tabs, send notification, both tabs should update immediately

4. **Test approval actions**: Create notification with actions, click button in UI, should log action

### Automated Testing

Test files:
- `tests/notifications/notification-orchestrator.test.ts` - Core notification logic
- `tests/notifications/unified-notification-service.test.ts` - Service routing and preferences
- `tests/routes/notifications.spec.ts` - API endpoints

Run tests:
```bash
bun test apps/backend/tests/notifications/
```

---

## Best Practices

1. **Always specify the category** - Helps users filter and organize
2. **Keep messages concise** - Especially for in-app notifications
3. **Use meaningful metadata** - Enables linking to related records
4. **Respect user preferences** - Set `respectPreferences: true` (default)
5. **Test approval flows** - Ensure actions are needed before requiring them
6. **Monitor delivery** - Check job queue for failures

---

## Adding a New Notification Trigger

To add a new notification in your application:

1. **Identify the event**: What action triggers the notification?

2. **Find the route/service**: Where does this action happen?

3. **Call the helper function**:
   ```typescript
   await sendToRoles(["role-code"], {
     type: "informational",
     title: "Human-readable title",
     message: "Clear, actionable message",
     category: "your-category",
     metadata: { relatedId: "123" },
   });
   ```

4. **Test**: Use the manual testing steps above

That's it! The notification system handles the rest.

---

## Troubleshooting

### Notifications not appearing in UI

1. Check if user has the channel enabled for that category
2. Verify `respectPreferences: false` if testing with disabled channels
3. Check browser console for SSE connection errors
4. Verify JWT token is valid in Authorization header

### Notifications queued but not processed

1. Check job queue worker is running: `jobQueueManager` should be initialized
2. Verify job handler is registered: `registry.ts` should include the handler
3. Check job handler logs for processing errors
4. Monitor database for `job_queue` table entries

### Email/WhatsApp not sending

Currently using mock implementations. To enable real delivery:

1. Configure email service credentials
2. Configure WhatsApp/WAHA service credentials
3. Update adapters to use real services
4. Replace email/whatsapp handlers with actual implementations

---

## Minimalist Philosophy

This notification system is kept intentionally minimal:

- **No templates**: Use simple title + message (add templates if needed)
- **No scheduling**: Send immediately or queue asynchronously (add scheduling if needed)
- **No analytics**: Basic delivery tracking only (add metrics if needed)
- **No complex rules**: Simple role/user targeting (add complex rules if needed)

This approach keeps the system:
- **Easy to understand**: Small codebase, clear flow
- **Easy to extend**: Clean interfaces for adding features
- **Easy to maintain**: Minimal dependencies, straightforward logic
- **Easy to test**: Clear layers with isolated concerns

Add features incrementally as your needs grow.
