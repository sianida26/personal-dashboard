# Notification Job Queue - Quick Reference

## What Was Fixed

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| **Email Job Type** | `"send-notification"` (❌ no handler) | `"email-notification"` (✓ found) | ✅ |
| **WhatsApp Job Type** | `"send-notification"` (❌ no handler) | `"whatsapp-notification"` (✓ found) | ✅ |
| **In-App Processing** | Sync, blocking ❌ | Async, queued ✓ | ✅ |
| **In-App Status** | `"sent"` (wrong) ❌ | `"scheduled"` (correct) ✓ | ✅ |
| **Handler Availability** | Email only ❌ | All three ✓ | ✅ |

## Files Changed

### Created (2)
```
✨ apps/backend/src/jobs/handlers/in-app-notification.ts      (116 lines)
✨ apps/backend/src/jobs/handlers/whatsapp-notification.ts     (78 lines)
```

### Modified (5)
```
📝 apps/backend/src/jobs/registry.ts                          (+4 lines)
📝 apps/backend/src/modules/notifications/channels/email-adapter.ts
📝 apps/backend/src/modules/notifications/channels/in-app-adapter.ts
📝 apps/backend/src/modules/notifications/channels/whatsapp-adapter.ts
📝 apps/backend/src/modules/notifications/unified-notification-service.ts
```

## How the Job Queue Works Now

```
┌─────────────────────────────────────────────────────────────┐
│  API Request: POST /api/notifications                       │
│  {userId, roleCodes, channels, category, ...}               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  For each channel (inApp, email, whatsapp):                 │
│  Adapter creates JOB in queue                               │
└────────────┬────────────────────────────────────────────────┘
             │
      ┌──────┴──────┬──────────────┬──────────────┐
      │             │              │              │
      ▼             ▼              ▼              ▼
   in-app        email         whatsapp    (response sent)
   job created    job created   job created
   status=pending status=pending status=pending

             ↓ (immediately returned to client)

┌─────────────────────────────────────────────────────────────┐
│  Client Response:                                           │
│  {                                                           │
│    results: [                                               │
│      {channel: "inApp", status: "scheduled", jobId: "..."}  │
│      {channel: "email", status: "scheduled", jobId: "..."}  │
│      {channel: "whatsapp", status: "scheduled", jobId: "..."} │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘

             ↓ (worker pool processes in background)

┌─────────────────────────────────────────────────────────────┐
│  Worker Pool (5 workers, polling every 1000ms):            │
│                                                             │
│  1. Get job: SELECT * FROM jobs WHERE status='pending'    │
│  2. Get handler: registry.get(job.type)                    │
│  3. Execute: handler.execute(payload, context)             │
│  4. Result: Update job status (completed/failed)           │
│  5. Metrics: Emit observability metrics                    │
│  6. Sleep: Wait 1000ms, loop back to step 1               │
└─────────────────────────────────────────────────────────────┘

             ↓ (results)

   ✓ In-app: Notification created, SSE → Frontend (real-time)
   ✓ Email: Sent by handler (currently mocked)
   ✓ WhatsApp: Sent by handler (currently mocked)
```

## Job Types & Handlers

| Job Type | Handler | Location | Status |
|----------|---------|----------|--------|
| `in-app-notification` | inAppNotificationHandler | `jobs/handlers/in-app-notification.ts` | ✓ Implemented |
| `email-notification` | emailNotificationHandler | `jobs/handlers/email-notification.ts` | ✓ Implemented |
| `whatsapp-notification` | whatsappNotificationHandler | `jobs/handlers/whatsapp-notification.ts` | ✓ Implemented |

## Job Status Flow

```
[pending]
    ↓ (worker picks up)
[processing]
    ├─→ success? → [completed] ✓
    ├─→ retryable failure? → [pending] (with scheduledAt delay)
    └─→ permanent failure? → [failed] ✗
```

## Handler Execution

Each handler:
1. Validates payload with Zod schema
2. Executes business logic (create notification, send email, etc.)
3. Returns: `{ success: boolean, message?: string, shouldRetry?: boolean }`
4. On retry: Exponential backoff (1s, 2s, 4s, ...)
5. Max retries: 3 (configurable)
6. Timeout: 30 seconds (configurable)

## How Frontend Gets Notified

```
Handler executes successfully (in-app channel)
    ↓
notificationEventHub.emit("created", notification)
    ↓
EventHub broadcasts to subscribed SSE streams
    ↓
Frontend receives: event: "notification", data: {...}
    ↓
Frontend displays notification in real-time
    ↓
User sees notification immediately ✓
```

## Testing

### Quick Test
```bash
# 1. Start app
npm run dev

# 2. Create notification (curl or API client)
POST /api/notifications
{
  "type": "informational",
  "title": "Test",
  "message": "Hello!",
  "userId": "user-1",
  "channels": ["inApp", "email", "whatsapp"],
  "category": "security"
}

# 3. Check jobs table
SELECT * FROM jobs WHERE status IN ('pending', 'processing', 'completed', 'failed');

# 4. Verify job types
- job.type should be: "in-app-notification"
- job.type should be: "email-notification"
- job.type should be: "whatsapp-notification"

# 5. Wait 2 seconds

# 6. Check job status
SELECT * FROM jobs ORDER BY createdAt DESC LIMIT 3;
# Status should be "completed" for all

# 7. Subscribe to SSE (frontend)
GET /api/notifications/stream
# Should receive notification event in real-time
```

## Common Issues & Solutions

### Problem: Job status stuck as "pending"
**Cause:** Handler not registered
**Fix:** Check `jobs/registry.ts` has the handler imported and registered

### Problem: Job status "failed" with "No handler for type: X"
**Cause:** Job type doesn't match handler type
**Fix:** Verify adapter JOB_TYPE matches handler's type property

### Problem: Email not sent
**Cause:** Handler is mock implementation
**Fix:** Replace handler with real email service (SendGrid, AWS SES, etc.)

### Problem: WhatsApp not sent
**Cause:** Handler is mock implementation
**Fix:** Replace handler with real integration (WAHA, Twilio)

### Problem: API response slow
**Cause:** Likely not using async job queue
**Fix:** Ensure adapter calls `jobQueueManager.createJob()` not direct DB

## Performance Metrics

- **Response Time:** < 100ms (jobs queued, not executed)
- **Worker Polling:** Every 1000ms
- **Parallel Workers:** 5 (configurable)
- **Max Retries:** 3 (configurable)
- **Exponential Backoff:** 1s, 2s, 4s

## Environment Variables

```bash
# Job Queue Configuration
JOB_QUEUE_MAX_WORKERS=5
JOB_QUEUE_POLL_INTERVAL=1000
JOB_QUEUE_DEFAULT_MAX_RETRIES=3
JOB_QUEUE_DEFAULT_TIMEOUT_SECONDS=30
JOB_QUEUE_RETRY_STRATEGY=exponential  # exponential|linear|fixed
```

## Relevant Code Locations

```
Job Queue System:
├── services/jobs/
│   ├── queue-manager.ts      (creates jobs)
│   ├── worker.ts             (executes jobs)
│   ├── worker-pool.ts        (manages workers)
│   ├── registry.ts           (maps types to handlers)
│   └── types.ts              (type definitions)
│
Notification System:
├── modules/notifications/
│   ├── notification-orchestrator.ts
│   ├── unified-notification-service.ts
│   ├── notification-repository.ts
│   └── channels/
│       ├── in-app-adapter.ts
│       ├── email-adapter.ts
│       ├── whatsapp-adapter.ts
│       └── types.ts
│
Job Handlers:
├── jobs/handlers/
│   ├── in-app-notification.ts     (new)
│   ├── email-notification.ts
│   ├── whatsapp-notification.ts   (new)
│   └── data-processing.ts
│
Database:
├── drizzle/schema/
│   ├── job-queue.ts               (jobs, jobExecutions, jobSchedules tables)
│   └── notifications.ts           (notifications table)
│
API Routes:
├── routes/
│   ├── notifications/route.ts
│   └── users/route.ts
```

## Commit Details

**Commit:** `2d0c2791`
**Author:** Yusoof Moh
**Date:** Mon Nov 3 01:23:26 2025
**Files Changed:** 7
**Insertions:** 220
**Deletions:** 12

## What This Enables

✅ **Email notifications** - Can now be queued and processed
✅ **WhatsApp notifications** - Can now be queued and processed
✅ **In-app notifications** - Now async and consistent
✅ **Real-time delivery** - Frontend gets SSE events immediately
✅ **Reliable retry** - Jobs retry on failure with backoff
✅ **Scalable** - Multiple workers process in parallel
✅ **Observable** - Job status tracking and metrics

## What Needs Implementation

⏳ **Real Email Service** - Replace mock in `email-notification.ts` handler
⏳ **Real WhatsApp Service** - Replace mock in `whatsapp-notification.ts` handler
⏳ **Monitoring Dashboard** - Add job queue metrics visualization
⏳ **Alerting** - Set up alerts for failed jobs

---

**For detailed information, see:**
- `NOTIFICATION_FLOW_EXPLAINED.md` - Complete technical breakdown
- `FIXES_APPLIED.md` - Detailed explanation of each fix
