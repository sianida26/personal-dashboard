# How Notifications Actually Get Sent - Complete Flow

This document explains the complete end-to-end flow of how a notification moves through the system from creation to actual delivery.

---

## Table of Contents

1. [Quick Summary](#quick-summary)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [Step-by-Step Breakdown](#step-by-step-breakdown)
4. [Job Queue Mechanics](#job-queue-mechanics)
5. [Channel Delivery Details](#channel-delivery-details)
6. [Real-Time Frontend Updates](#real-time-frontend-updates)
7. [Current Issues & Missing Pieces](#current-issues--missing-pieces)

---

## Quick Summary

**When you send a notification, here's what happens:**

1. **Request comes in** → `POST /api/notifications`
2. **API calls orchestrator** → `orchestrator.createNotification()`
3. **Currently (MAIN BRANCH):**
   - ✓ Creates in-app notification immediately
   - ✓ Emits SSE event → Frontend gets it in real-time
   - ✗ Email/WhatsApp channels: **NOT PROCESSED AT ALL**

4. **After PR merge (INTENDED):**
   - ✓ Creates job for in-app (async)
   - ✓ Creates job for email (async)
   - ✓ Creates job for WhatsApp (async)
   - ✓ Returns immediately (all queued)
   - ✓ Workers process jobs in background
   - ✓ Frontend gets in-app notification via SSE

---

## Complete Flow Diagram

```
REQUEST ENTRY
├─ POST /api/notifications
├─ Payload: {userId, roleCodes, channels, category, ...}
└─ Response: Immediate (jobs queued or created)

     │
     ▼

ORCHESTRATOR/UNIFIED SERVICE
├─ Resolve channels (inApp, email, whatsapp)
├─ Resolve recipients (userId → actual user list)
├─ Fetch user details (email, phoneNumber)
└─ For EACH channel → call adapter

     │
     ├─────────────────────────────────┬─────────────────────┬──────────────────┐
     │                                 │                     │                  │
     ▼                                 ▼                     ▼                  ▼

IN-APP ADAPTER                  EMAIL ADAPTER          WHATSAPP ADAPTER    (Preference Filter)
├─ CURRENT: Direct DB call      ├─ Queue job           ├─ Queue job per    └─ Check if user
│  (Synchronous)                │ (Async)               │   recipient         enabled channel
│                               │                      │ (Async)
├─ PROBLEM:                     ├─ Job Type:           │
│  - Slow                       │ "send-notify"     ✗  ├─ Job Type:
│  - Not resilient              │ (WRONG!)              │ "send-notify"    ✗
│  - Blocks if DB fails         │                      │ (WRONG!)
│                               ├─ Returns:
├─ PR SOLUTION:                 │ jobId + "scheduled"  └─ Returns:
│ Queue job like others         │                        jobId + "scheduled"
│                               └─ Job sits in queue
│                                 until worker picks up
│
└─ Returns "sent" (WRONG)

     │
     ▼

RESPONSE TO CLIENT (Immediate)
├─ {
│   results: [
│     {userId, channel: "inApp", status: "sent", ...},
│     {userId, channel: "email", status: "scheduled", jobId: "..."},
│     {userId, channel: "whatsapp", status: "scheduled", jobId: "..."}
│   ]
│ }
└─ Client knows which channels were queued

     │
     ├─────────────────────────────┬────────────────────┬──────────────────┐
     │                             │                    │                  │
     ▼                             ▼                    ▼                  ▼

SYNC PATH (In-App)              JOB QUEUE             JOB QUEUE        JOB QUEUE
├─ Create notification        ├─ jobs table        ├─ jobs table     ├─ jobs table
├─ Emit "created" event       │ {                  │ {               │ {
├─ SSE streams to frontend    │  type: "email",    │  type:          │  type:
│  in real-time               │  status: pending   │  "whatsapp",    │ (Depends)
│                             │ }                  │  status: pending│ }
└─ Frontend shows it NOW      │                    │ }               │
                              └─ Stays in queue    └─ Stays in queue │
                                until worker         until worker    └─ Stays until
                                picks up             picks up           worker picks up

     │
     ▼

WORKER POOL (Background)
├─ 5 workers, each polling every 1000ms
├─ SQL: SELECT * FROM jobs WHERE status='pending' ORDER BY priority LIMIT 1
├─ For each job:
│  ├─ Mark status = "processing"
│  ├─ Get handler from registry
│  ├─ Validate payload
│  ├─ Execute handler
│  └─ Handle result (success, retry, or fail)
│
└─ Handler results:
   ├─ SUCCESS: status = "completed", emit metrics
   ├─ RETRYABLE FAILURE: status = "pending", scheduledAt = now + backoff
   └─ PERMANENT FAILURE: status = "failed", call onFailure hook

     │
     ▼

JOB COMPLETION
├─ Email sent (or retried/failed)
├─ WhatsApp sent (or retried/failed)
├─ In-app notification in DB (replicated to frontend)
└─ Metrics logged for monitoring
```

---

## Step-by-Step Breakdown

### 1. API Entry Point

**File:** `routes/notifications/route.ts:149-174`

```typescript
.post("/",
  requestValidator("json", createNotificationSchema),
  async (c) => {
    // ✓ Check super-admin permission
    if (!currentUser?.roles.includes("super-admin")) {
      forbidden({ message: "..." });
    }

    // ✓ Validate payload
    const payload = c.req.valid("json");

    // ✗ CURRENT: Uses old orchestrator (only in-app)
    const notifications = await orchestrator.createNotification(payload);

    // ✓ Returns immediate response
    return c.json({
      notifications,
      recipients: notifications.map((item) => item.userId),
    }, 201);

    // ✓ SHOULD INSTEAD: Call unified service
    // await unifiedNotificationService.sendNotification({...})
  }
)
```

---

### 2. What Orchestrator Currently Does

**File:** `modules/notifications/notification-orchestrator.ts:96-100`

```typescript
async createNotification(
  input: CreateNotificationInput & { priority?: string },
): Promise<NotificationViewModel[]> {
  // Creates in-app notifications ONLY
  // Does NOT queue email/whatsapp
  // Direct database operation (synchronous)
  // Emits "created" events immediately
}
```

**Result:**
- ✓ In-app notifications work
- ✗ Email/WhatsApp completely ignored

---

### 3. What Unified Service SHOULD Do

**File:** `modules/notifications/unified-notification-service.ts:60-110`

```typescript
async sendNotification(request: UnifiedNotificationRequest) {
  // Step 1: Resolve channels from request
  const channels = this.resolveChannels(request.channels);
  // Example output: ["inApp", "email", "whatsapp"]

  // Step 2: Resolve audience (userId/roleCodes → actual user IDs)
  const userIds = await this.resolveAudience(request);
  // Example: ["user-1", "user-2", "user-3"]

  // Step 3: Load user details (email, phone, etc.)
  const recipients = await this.fetchRecipients(userIds);
  // Example: [{userId, email, phoneNumber, ...}, ...]

  // Step 4: Process each channel independently
  for (const channel of channels) {
    // Get adapter for this channel
    const adapter = this.adapters.get(channel);

    // Filter recipients by user preferences
    const { allowed, skipped } =
      await this.partitionRecipientsByPreference(
        recipients,
        request.category,
        channel,
        request.respectPreferences ?? true,
      );

    // Call adapter to deliver
    const channelResults = await adapter.deliver({
      channel,
      recipients: allowed,
      request,
    });

    results.push(...channelResults);
  }

  return { results };
}
```

---

### 4. How Each Channel Adapter Works

#### Email Adapter

**File:** `channels/email-adapter.ts`

```typescript
async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
  // 1. Get email addresses from recipients
  const recipientEmails = recipients
    .map((r) => r.email)
    .filter((e) => Boolean(e));

  // 2. Build job payload
  const payload: NotificationJobPayload = {
    email: {
      to: recipientEmails,
      subject: request.title,
      body: request.message,
      metadata: {...}
    },
  };

  // 3. CREATE JOB (not execute immediately)
  const jobId = await jobQueueManager.createJob({
    type: "send-notification",  // ✗ BUG: Should be "email-notification"
    payload,
    priority: request.jobOptions?.priority,
    maxRetries: request.jobOptions?.maxRetries,
  });

  // 4. Return IMMEDIATELY with job reference
  return recipients.map((recipient) => ({
    userId: recipient.userId,
    channel: "email",
    status: "scheduled",  // Job will be processed soon
    jobId,
  }));
}
```

**Key Insight:** Email adapter doesn't send emails itself. It just creates a job in the queue. The actual sending happens LATER when a worker picks up the job.

#### WhatsApp Adapter

**File:** `channels/whatsapp-adapter.ts`

```typescript
async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
  const results = [];

  // For each recipient (different phone numbers)
  for (const recipient of recipients) {
    const phoneNumber = recipient.phoneNumber;

    if (!phoneNumber) {
      // No phone? Skip this recipient
      results.push({
        userId: recipient.userId,
        channel: "whatsapp",
        status: "skipped",
        reason: "No phone number available",
      });
      continue;
    }

    // Build payload
    const payload: NotificationJobPayload = {
      whatsapp: {
        phoneNumber,
        message: request.message,
        metadata: {...}
      },
    };

    // CREATE JOB
    const jobId = await jobQueueManager.createJob({
      type: "send-notification",  // ✗ BUG: Should be "whatsapp-notification"
      payload,
      priority: request.jobOptions?.priority,
      maxRetries: request.jobOptions?.maxRetries,
    });

    results.push({
      userId: recipient.userId,
      channel: "whatsapp",
      status: "scheduled",
      jobId,
    });
  }

  return results;
}
```

**Key Difference from Email:**
- Email sends to multiple addresses in ONE job
- WhatsApp creates ONE job per recipient (each has different phone)

#### In-App Adapter

**File:** `channels/in-app-adapter.ts`

```typescript
async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
  const payload: CreateNotificationInput = {
    type: request.notificationType ?? "informational",
    title: request.title,
    message: request.message,
    userIds: recipients.map((r) => r.userId),
    metadata: request.metadata,
    status: "unread",
    category: request.category,
  };

  // ✗ PROBLEM: Still calling orchestrator directly
  try {
    await this.orchestrator.createNotification(payload);
    return recipients.map((recipient) => ({
      userId: recipient.userId,
      channel: "inApp",
      status: "sent",  // ✗ Should be "scheduled"
    }));
  } catch (error) {
    // If fails, whole request fails
    return recipients.map((recipient) => ({
      userId: recipient.userId,
      channel: "inApp",
      status: "failed",
      reason: error.message,
    }));
  }
}
```

**Problems:**
1. `await orchestrator.createNotification()` is **SYNCHRONOUS**
   - Blocks until database completes
   - If database slow → whole request slow
2. Returns `"sent"` instead of `"scheduled"`
   - Inconsistent with email/whatsapp
3. No retry logic
   - If database fails → permanent failure

**What PR Says It Should Do:**
```typescript
// Create in-app-notification job instead
const jobPayload: InAppNotificationJobPayload = {
  notification: payload
};
const jobId = await jobQueueManager.createJob({
  type: "in-app-notification",  // ✓ New handler type
  payload: jobPayload,
  priority,
  maxRetries
});
return recipients.map(r => ({
  userId: r.userId,
  channel: "inApp",
  status: "scheduled",  // ✓ Now consistent
  jobId
}));
```

---

## Job Queue Mechanics

### How Jobs Get Created

```typescript
// Application code
const jobId = await jobQueueManager.createJob({
  type: "email-notification",
  payload: {
    email: {
      to: ["user@example.com"],
      subject: "Hello",
      body: "Welcome!",
    }
  },
  priority: "high",
  maxRetries: 3,
});

// What happens inside:
// 1. Validate job type exists in registry
// 2. Get default settings from handler
// 3. Insert into database:
//    INSERT INTO jobs (id, type, payload, status, priority, ...)
//    VALUES (CUID2(), "email-notification", JSON, "pending", 1, ...)
// 4. Return jobId immediately
```

### How Jobs Get Processed

**File:** `services/jobs/worker.ts`

```
WORKER LOOP (Runs continuously):

while (worker.isRunning) {
  // 1. Poll database for next pending job
  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "pending"))
    .orderBy(jobs.priority, jobs.createdAt)
    .limit(1);

  if (!job) {
    // No jobs waiting
    await sleep(1000);  // Wait 1 second, try again
    continue;
  }

  // 2. Mark job as processing
  job.status = "processing";
  job.workerId = "worker-3";
  job.startedAt = now();
  await db.update(jobs).set(job);

  // 3. Get handler from registry
  const handler = jobHandlerRegistry.get(job.type);
  if (!handler) {
    // NO HANDLER FOUND!
    job.status = "failed";
    job.errorMessage = `No handler for type: ${job.type}`;
    await db.update(jobs).set(job);
    continue;  // Move to next job
  }

  // 4. Create execution context
  const context = {
    jobId: job.id,
    attemptNumber: job.retryCount + 1,
    logger: createLogger(`job:${job.id}`),
    abortSignal: new AbortSignal(),
  };

  try {
    // 5. Validate payload using handler's schema
    const validated = handler.validate?.(job.payload) ?? job.payload;

    // 6. Execute handler with timeout
    const timeoutMs = handler.defaultTimeoutSeconds * 1000;
    const result = await executeWithTimeout(
      handler.execute(validated, context),
      timeoutMs
    );

    // 7. Handle success
    if (result.success) {
      job.status = "completed";
      job.completedAt = now();
      await db.update(jobs).set(job);
      handler.onSuccess?.(result, context);
      emit("jobsCompleted", { jobType: job.type });
    }
    // 8. Handle retryable failure
    else if (result.shouldRetry && job.retryCount < job.maxRetries) {
      const delay = calculateBackoffDelay(job.retryCount);
      job.status = "pending";
      job.retryCount++;
      job.scheduledAt = new Date(now().getTime() + delay);
      await db.update(jobs).set(job);
      // Job goes back in queue with delayed execution
    }
    // 9. Handle permanent failure
    else {
      job.status = "failed";
      job.failedAt = now();
      job.errorMessage = result.message;
      await db.update(jobs).set(job);
      handler.onFailure?.(error, context);
      emit("jobsFailed", { jobType: job.type, error: result.message });
    }
  } catch (error) {
    // Same retry/fail logic as above
  }

  // 10. Sleep before polling again
  await sleep(1000);
}
```

### Job Status Transitions

```
                    [pending]
                      │  │
                      │  └─────────────────┐
                      │                    │
                      ▼                    │
                [processing]               │
                  │       │                │
            ┌─────┴───┬───┴────┐           │
            │         │        │           │
       success    retry    fail            │
            │         │        │           │
            ▼         ▼        ▼           ▼
      [completed] [pending] [failed]  (delay)
                      │              (1s, 2s, 4s...)
                      │
                  (after delay)
                      │
                      ▼
                [processing]
```

### Handler Registry

**File:** `jobs/registry.ts`

```typescript
class JobHandlerRegistry {
  private handlers = new Map<string, JobHandler>();

  register(handler: JobHandler): void {
    // handler.type = "email-notification"
    // Stores: map["email-notification"] = handlerObject
    this.handlers.set(handler.type, handler);
  }

  get(type: string): JobHandler | undefined {
    // type = "email-notification"
    // Returns: handlerObject or undefined
    return this.handlers.get(type);
  }
}

// Global registry
const jobHandlerRegistry = new JobHandlerRegistry();
jobHandlerRegistry.register(emailNotificationHandler);
jobHandlerRegistry.register(dataProcessingHandler);
// ✗ Missing: in-app-notification handler
// ✗ Missing: whatsapp-notification handler

export default jobHandlerRegistry;
```

---

## Channel Delivery Details

### Email Handler

**File:** `jobs/handlers/email-notification.ts:12-73`

```typescript
const emailNotificationHandler: JobHandler<EmailNotificationPayload> = {
  type: "email-notification",
  description: "Send email notifications to users",
  defaultMaxRetries: 3,
  defaultTimeoutSeconds: 30,

  validate(payload: unknown): EmailNotificationPayload {
    // Validate with Zod
    return payloadSchema.parse(payload);
  },

  async execute(payload, context) {
    const { userId, template } = payload;

    context.logger.info(`Sending email to ${userId}`);

    // ACTUAL SENDING HAPPENS HERE
    // Currently: mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Demo: 10% failure rate
    if (Math.random() < 0.1) {
      throw new Error("Email service temporarily unavailable");
    }

    // Return success
    return {
      success: true,
      message: `Email sent to ${userId}`,
      data: { userId, template },
    };
  },

  async onFailure(error, context) {
    // Called when job fails permanently
    context.logger.error(`Email failed: ${error.message}`);
  },

  async onSuccess(result, context) {
    // Called when job completes successfully
    context.logger.info(`Email job completed: ${context.jobId}`);
  },
};
```

### WhatsApp Handler (From PR)

**File:** `jobs/handlers/whatsapp-notification.ts` (FUTURE)

```typescript
const whatsappNotificationHandler: JobHandler<WhatsAppNotificationPayload> = {
  type: "whatsapp-notification",  // ✓ Unique type
  description: "Send WhatsApp notifications",
  defaultMaxRetries: 3,
  defaultTimeoutSeconds: 30,

  validate(payload: unknown): WhatsAppNotificationPayload {
    return payloadSchema.parse(payload);
  },

  async execute(payload, context) {
    const { phoneNumber, message } = payload;

    context.logger.info(`Sending WhatsApp to ${phoneNumber}`);

    // TODO: Real WAHA or Twilio integration
    // Currently: mock
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (Math.random() < 0.05) {
      throw new Error("WhatsApp service unavailable");
    }

    return {
      success: true,
      message: `WhatsApp sent to ${phoneNumber}`,
      data: { phoneNumber, message },
    };
  },

  async onFailure(error, context) {
    context.logger.error(`WhatsApp failed: ${error.message}`);
  },

  async onSuccess(result, context) {
    context.logger.info(`WhatsApp job completed: ${context.jobId}`);
  },
};
```

### In-App Handler (From PR)

**File:** `jobs/handlers/in-app-notification.ts` (FUTURE)

```typescript
const inAppNotificationHandler: JobHandler<InAppNotificationJobPayload> = {
  type: "in-app-notification",  // ✓ Unique type
  description: "Create in-app notifications",
  defaultMaxRetries: 3,
  defaultTimeoutSeconds: 30,

  async execute(payload, context) {
    const { notification } = payload;

    // 1. Resolve recipients
    const recipients = new Set<string>();

    if (notification.userId) {
      recipients.add(notification.userId);
    }
    notification.userIds?.forEach((id: string) => {
      recipients.add(id);
    });
    if (notification.roleCodes?.length) {
      const ids = await repo.findUserIdsByRoleCodes(notification.roleCodes);
      ids.forEach((id) => recipients.add(id));
    }

    if (recipients.size === 0) {
      throw new Error("No recipients resolved");
    }

    // 2. Create notification records
    for (const recipientId of recipients) {
      const created = await repo.createNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        userId: recipientId,
        metadata: notification.metadata || {},
        status: "unread",
        category: notification.category,
        expiresAt: notification.expiresAt ?? null,
      });

      // 3. Emit SSE event for real-time frontend update
      notificationEventHub.emit("created", created);
    }

    return {
      success: true,
      message: `Created for ${recipients.size} recipient(s)`,
    };
  },

  async onFailure(error, context) {
    context.logger.error(`In-app notification failed: ${error.message}`);
  },

  async onSuccess(result, context) {
    context.logger.info(`In-app notification job completed: ${context.jobId}`);
  },
};
```

---

## Real-Time Frontend Updates

### How Frontend Gets Notified

**File:** `routes/notifications/route.ts:68-88`

```typescript
.get("/stream", async (c) => {
  const userId = requireUserId(c);

  return streamSSE(c, async (stream) => {
    // 1. Subscribe to "created" events for this user
    const unsubscribe = notificationEventHub.onCreatedForUser(
      userId,
      async (payload) => {
        // 2. Send SSE event to frontend
        await stream.writeSSE({
          event: "notification",
          data: JSON.stringify(payload),
        });
      },
    );

    // 3. Keep connection open
    await new Promise<void>((resolve) => {
      stream.onAbort(async () => {
        unsubscribe();
        resolve();
      });
    });
  });
})
```

### Event Hub

**File:** `lib/event-bus/notification-event-hub.ts`

```typescript
class NotificationEventHub {
  // Global typed EventEmitter
  private emitter = new EventEmitter3<{
    created: [notification],
    read: [notificationId],
    actioned: [notificationId, actionKey],
  }>();

  emit(eventType: string, payload: any) {
    // Handler calls: notificationEventHub.emit("created", notification)
    this.emitter.emit(eventType, payload);
  }

  onCreatedForUser(userId: string, callback: (payload) => void) {
    // Frontend subscribes: onCreatedForUser(myUserId, (notif) => ...)
    const handler = (payload) => {
      if (payload.userId === userId) {
        callback(payload);
      }
    };
    this.emitter.on("created", handler);
    return () => this.emitter.off("created", handler);
  }
}
```

### Flow: Handler → Frontend

```
Handler executes (e.g., in-app job handler)
  ↓
notificationEventHub.emit("created", {userId: "user-1", title: "...", ...})
  ↓
EventHub broadcasts to all subscribers
  ↓
Frontend SSE listener receives:
  event: notification
  data: {userId: "user-1", title: "...", ...}
  ↓
Frontend JavaScript receives event
  ↓
Frontend updates UI (add notification to inbox, show banner, etc.)
  ↓
USER SEES NOTIFICATION IN REAL TIME
```

---

## Current Issues & Missing Pieces

### Issue #1: Email Adapter Uses Wrong Job Type

**Location:** `channels/email-adapter.ts:8`

```typescript
const JOB_TYPE = "send-notification" as const;  // ✗ BUG!
```

**Problem:**
- Email adapter queues jobs with type: `"send-notification"`
- Handler registry only has type: `"email-notification"`
- When worker tries to find handler for `"send-notification"` → **NOT FOUND**
- Job fails: `"No handler for type: send-notification"`

**Fix:**
```typescript
const JOB_TYPE = "email-notification" as const;  // ✓ Match handler type
```

---

### Issue #2: WhatsApp Adapter Uses Wrong Job Type

**Location:** `channels/whatsapp-adapter.ts:8`

```typescript
const JOB_TYPE = "send-notification" as const;  // ✗ BUG!
```

**Problem:** Same as email - handler type mismatch

**Fix:**
```typescript
const JOB_TYPE = "whatsapp-notification" as const;  // ✓ Match handler type (when PR merged)
```

---

### Issue #3: In-App Adapter Not Using Job Queue

**Location:** `channels/in-app-adapter.ts:51-56`

```typescript
try {
  await this.orchestrator.createNotification(payload);  // ✗ SYNCHRONOUS!
  return recipients.map((recipient) => ({
    userId: recipient.userId,
    channel: this.channel,
    status: "sent" as const,  // ✗ Should be "scheduled"
  }));
}
```

**Problems:**
1. Calls `orchestrator.createNotification()` synchronously
   - Blocks API response until database completes
   - If database is slow → API response is slow
2. Returns `"sent"` instead of `"scheduled"`
   - Inconsistent with email/whatsapp adapters
3. No retry logic
   - If database fails → job fails permanently

**Fix (From PR):**
```typescript
const jobPayload: InAppNotificationJobPayload = {
  notification: payload
};
const jobId = await jobQueueManager.createJob({
  type: "in-app-notification",
  payload: jobPayload,
  priority: request.jobOptions?.priority,
  maxRetries: request.jobOptions?.maxRetries,
});
return recipients.map((recipient) => ({
  userId: recipient.userId,
  channel: this.channel,
  status: "scheduled",  // ✓ Now consistent
  jobId,
}));
```

---

### Issue #4: Missing Handler Registrations

**Location:** `jobs/registry.ts:76-77`

```typescript
jobHandlerRegistry.register(emailNotificationHandler);
jobHandlerRegistry.register(dataProcessingHandler);

// ✗ Missing from current code:
// jobHandlerRegistry.register(inAppNotificationHandler);
// jobHandlerRegistry.register(whatsappNotificationHandler);
```

**Problem:**
- Handlers defined but not registered
- Workers can't find handlers → jobs fail

**Fix (From PR):**
```typescript
jobHandlerRegistry.register(emailNotificationHandler);
jobHandlerRegistry.register(dataProcessingHandler);
jobHandlerRegistry.register(inAppNotificationHandler);  // ✓ Add this
jobHandlerRegistry.register(whatsappNotificationHandler);  // ✓ Add this
```

---

### Issue #5: API Still Uses Old Orchestrator

**Location:** `routes/notifications/route.ts:164`

```typescript
const notifications = await orchestrator.createNotification(payload);
```

**Problem:**
- Only creates in-app notifications
- Email/WhatsApp channels never queued
- No way to send multi-channel notifications

**Fix (From PR):**
```typescript
await unifiedNotificationService.sendNotification({
  userId: payload.userId,
  userIds: payload.userIds,
  roleCodes: payload.roleCodes,
  channels: ["inApp", "email", "whatsapp"],  // Send to all channels
  category: payload.category,
  notificationType: payload.type,
  title: payload.title,
  message: payload.message,
  metadata: payload.metadata,
  respectPreferences: true,
});
```

---

## Summary: How Notifications Actually Get Sent

### Current State (Main Branch - BROKEN)

```
User sends notification request
  ↓
API calls orchestrator.createNotification()
  ↓
Only in-app notifications created
  ↓
Email job queued with WRONG type ("send-notification")
  ↓
Worker picks up job, looks for handler
  ↓
No handler found → Job fails permanently
  ↓
WhatsApp job queued with WRONG type ("send-notification")
  ↓
Same failure

RESULT:
✓ In-app notifications work and appear in real-time
✗ Email notifications: NEVER SENT (jobs fail)
✗ WhatsApp notifications: NEVER SENT (jobs fail)
```

### Intended State (After PR Merge)

```
User sends notification request
  ↓
API calls unifiedNotificationService.sendNotification()
  ↓
Resolves audience, loads user details
  ↓
For each channel (inApp, email, whatsapp):
  - Check user preferences
  - Create appropriate job
  ↓
Job created with CORRECT type:
  - In-app: "in-app-notification"
  - Email: "email-notification"
  - WhatsApp: "whatsapp-notification"
  ↓
Return immediately with job IDs
  ↓
Worker pool processes jobs asynchronously:
  - In-app: Create DB record + emit SSE event
  - Email: Send via email service
  - WhatsApp: Send via WAHA/Twilio
  ↓
Retry with exponential backoff if fails
  ↓
Metrics logged for monitoring

RESULT:
✓ All notifications queued properly
✓ In-app notifications appear in real-time (SSE)
✓ Email notifications sent successfully
✓ WhatsApp notifications sent successfully
✓ Resilient to failures (retries)
✓ Non-blocking API (immediate response)
```

---

## What Needs to Happen

To fix the notification system:

1. **Merge the PR that:**
   - ✓ Creates `in-app-notification.ts` handler
   - ✓ Creates `whatsapp-notification.ts` handler
   - ✓ Registers both handlers in registry
   - ✓ Updates in-app adapter to use job queue
   - ✓ Updates routes to use `unifiedNotificationService`

2. **Test the flow:**
   - Create a notification
   - Check job queue has correct job types
   - Monitor workers processing jobs
   - Verify frontend receives SSE events
   - Confirm emails/messages sent

---

## Testing Checklist

- [ ] Application starts without errors
- [ ] Job handlers registered correctly
- [ ] Can create notification via API
- [ ] Jobs created with correct types
- [ ] Worker pool picks up jobs
- [ ] In-app notification created + SSE event sent
- [ ] Email job completes successfully
- [ ] WhatsApp job completes successfully
- [ ] Frontend receives real-time notifications
- [ ] Retry logic works on failures
- [ ] Metrics collected properly
