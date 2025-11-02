# Notification System Documentation

## Overview

System notifikasi yang type-safe dengan support untuk 3 channel berbeda:
- **In-App Notifications**: Notifikasi di aplikasi
- **Email**: Notifikasi via email dengan Microsoft Graph API
- **WhatsApp**: Notifikasi via WhatsApp menggunakan WAHA

## Architecture

```
┌─────────────────┐
│  Route Handler  │
│  (quick-update) │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│  Notification Service       │
│  (lead-notifications.ts)    │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Job Queue Manager          │
│  (creates background job)   │
└────────┬────────────────────┘
         │
         v
┌─────────────────────────────┐
│  Send Notification Handler  │
│  (send-notification.ts)     │
└────────┬────────────────────┘
         │
         ├──────────┬──────────┬──────────┐
         v          v          v          v
    ┌────────┐ ┌───────┐ ┌────────┐ ┌────────┐
    │ In-App │ │ Email │ │WhatsApp│ │  Logs  │
    └────────┘ └───────┘ └────────┘ └────────┘
```

## Core Components

### 1. Type Definitions (`src/types/notifications.ts`)

Berisi semua TypeScript interfaces untuk type safety:

```typescript
// Base types
type NotificationType = "informational" | "success" | "warning" | "error" | "urgent";
type NotificationPriority = "low" | "normal" | "high" | "critical";
type NotificationCategory = "leads" | "projects" | "tasks" | "system" | "general";

// Template data interfaces
interface LeadClosedWinTemplateData extends BaseNotificationTemplateData {}
interface SalesAssignmentTemplateData extends BaseNotificationTemplateData {
    isUnassignment: boolean;
    previousSalesName?: string;
}
interface PresalesAssignmentTemplateData extends BaseNotificationTemplateData {
    presalesName: string;
    isUnassignment: boolean;
    previousPresalesName?: string;
}

// Job payload
interface NotificationJobPayload extends Record<string, unknown> {
    inApp?: BaseNotificationPayload;
    email?: EmailNotificationPayload;
    whatsapp?: WhatsAppNotificationPayload;
    checkPreferences?: boolean;
}
```

### 2. Notification Templates (`src/utils/notification-templates.ts`)

Template sistem untuk generate konten notifikasi:

```typescript
export const notificationTemplates = {
    lead: {
        closedWin: (data: LeadClosedWinTemplateData): NotificationTemplate => ({
            type: "success",
            priority: "high",
            title: "Deal Closed - Win! 🎉",
            message: `Deal "${data.dealName}" telah ditutup oleh ${data.salesName}`,
            emailSubject: `🎉 Deal Closed Win - ${data.dealName}`,
            emailBody: `<html>...</html>`, // HTML email template
        }),
        
        salesAssignment: (data: SalesAssignmentTemplateData): NotificationTemplate => ({
            // ... sales assignment template
        }),
        
        presalesAssignment: (data: PresalesAssignmentTemplateData): NotificationTemplate => ({
            // ... presales assignment template
        }),
    },
};
```

### 3. Notification Service (`src/utils/notifications/lead-notifications.ts`)

Service layer untuk mengirim notifikasi dengan job queue:

```typescript
// Exported interfaces untuk type safety
export interface LeadClosedWinNotificationData {
    leadId: string;
    dealName: string;
    companyName: string;
    salesId: string | null;
    salesName: string;
    salesEmail?: string;
    estimatedPrice: string;
    customerEmail: string;
    customerPhone: string;
    leadDetailUrl: string;
    sendToEmail: string;
    ccEmails: string[];
}

// Function untuk kirim notifikasi
export async function sendLeadClosedWinNotification(
    data: LeadClosedWinNotificationData,
): Promise<void> {
    // Generate template
    const template = notificationTemplates.lead.closedWin({
        dealName: data.dealName,
        companyName: data.companyName,
        salesName: data.salesName,
        estimatedPrice: data.estimatedPrice,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        leadDetailUrl: data.leadDetailUrl,
    });

    // Prepare payload untuk semua channels
    const payload: NotificationJobPayload = {
        inApp: {
            type: template.type,
            title: template.title,
            message: template.message,
            category: "leads",
            priority: template.priority,
            userIds: data.salesId ? [data.salesId] : [],
            expiresAt: getExpirationDate("leads", "closed_win"),
            metadata: {
                leadId: data.leadId,
                companyName: data.companyName,
                salesId: data.salesId,
                status: "Buy",
            },
        },
        email: {
            to: data.sendToEmail,
            cc: data.ccEmails,
            subject: template.emailSubject ?? "Lead Closed Win",
            body: template.emailBody ?? "",
            metadata: {
                leadId: data.leadId,
                category: "leads",
                type: "closed_win",
            },
        },
    };

    // Queue notification job untuk background processing
    await jobQueueManager.createJob({
        type: "send-notification",
        priority: 200, // high priority
        payload,
        maxRetries: 3,
    });
}
```

### 4. Job Handler (`src/jobs/handlers/send-notification.ts`)

Background job handler untuk process notifikasi:

```typescript
const sendNotificationHandler: JobHandler<NotificationJobPayload> = {
    type: "send-notification",
    description: "Send notification handler\nProcesses multi-channel notifications",
    defaultMaxRetries: 3,
    defaultTimeoutSeconds: 60,

    async execute(payload, context) {
        const results: NotificationResult[] = [];

        // Send in-app notification
        if (payload.inApp) {
            const inAppType = mapToInAppType(payload.inApp.type);
            await notificationOrchestrator.createNotification({
                ...payload.inApp,
                type: inAppType,
                metadata: payload.inApp.metadata ?? {},
            });
            results.push({ channel: "inApp", success: true });
        }

        // Send email notification
        if (payload.email) {
            await sendEmailWithAttachment({
                to: payload.email.to,
                cc: payload.email.cc,
                subject: payload.email.subject,
                body: payload.email.body,
            });
            results.push({ channel: "email", success: true });
        }

        // Send WhatsApp notification
        if (payload.whatsapp) {
            await whatsAppService.sendMessage(
                payload.whatsapp.phoneNumber,
                payload.whatsapp.message,
            );
            results.push({ channel: "whatsapp", success: true });
        }

        return { success: true, results };
    },

    async onSuccess(_result, context) {
        context.logger.info(`Notification job ${context.jobId} completed successfully`);
    },

    async onFailure(error, context) {
        context.logger.error(
            error instanceof Error
                ? error
                : new Error(`Notification job ${context.jobId} failed`),
        );
    },
};

export default sendNotificationHandler;
```

### 5. Registry Integration (`src/jobs/registry.ts`)

Register handler ke job queue system:

```typescript
import sendNotificationHandler from "./handlers/send-notification";

export class JobHandlerRegistry {
    register<T extends Record<string, unknown>>(handler: JobHandler<T>): void {
        if (this.handlers.has(handler.type)) {
            throw new Error(`Job handler for type '${handler.type}' already registered`);
        }
        this.handlers.set(handler.type, handler as JobHandler);
    }
}

// Register handler
jobHandlerRegistry.register(sendNotificationHandler);
```

## Usage Example

### Dalam Route Handler

```typescript
import {
    sendLeadClosedWinNotification,
    sendSalesAssignmentNotification,
    sendPresalesAssignmentNotification,
} from "../../utils/notifications/lead-notifications";

// Example: Send notification saat lead closed win
if (updateData.status === "Buy" && lead.status !== "Buy") {
    try {
        await sendLeadClosedWinNotification({
            leadId: lead.id,
            dealName: namaDeal,
            companyName: customer?.companyName || "-",
            salesId: updatedLeadPicId,
            salesName: namaSales,
            salesEmail: sales?.email ?? undefined,
            estimatedPrice: String(lead.estimatedPrice || "0"),
            customerEmail: customer?.email || "-",
            customerPhone: customer?.phoneNumber || "",
            leadDetailUrl,
            sendToEmail,
            ccEmails,
        });
    } catch (notificationError) {
        console.error("Failed to send lead closed win notification", notificationError);
    }
}

// Example: Send notification saat sales assignment
if (updateData.leadPic !== undefined && updateData.leadPic !== lead.leadPic) {
    const isUnassignment = updateData.leadPic === "" && lead.leadPic;
    
    try {
        await sendSalesAssignmentNotification({
            leadId: lead.id,
            dealName: namaDeal,
            companyName: customer?.companyName || "-",
            salesId: updateData.leadPic === "" ? null : updateData.leadPic,
            salesName: namaSales,
            salesEmail: salesUser?.email ?? undefined,
            previousSalesId: lead.leadPic,
            previousSalesName: namaPreviousSales,
            previousSalesEmail: previousSalesUser?.email ?? undefined,
            isUnassignment,
            estimatedPrice: String(lead.estimatedPrice || "0"),
            customerEmail: customer?.email || "-",
            customerPhone: customer?.phoneNumber || "",
            leadDetailUrl,
            ccEmails,
        });
    } catch (notificationError) {
        console.error("Failed to send sales assignment notification", notificationError);
    }
}
```

## Environment Variables

```env
# Frontend URL untuk links di notifikasi
FRONTEND_URL=https://internal.dsg.id

# Email configuration
SENDMAIL_TO=dean@dsg.id
SENDMAIL_CC=mey@dsg.id,retno.swari@dsg.id

# WhatsApp configuration
PHONE_NUMBER_WAHA=628123456789
```

## Migration Guide ke Project Lain

### 1. Copy Files

```bash
# Core files yang wajib di-copy
src/types/notifications.ts
src/utils/notification-templates.ts
src/utils/notification-expiration.ts
src/utils/notifications/lead-notifications.ts
src/jobs/handlers/send-notification.ts
```

### 2. Update Registry

```typescript
// src/jobs/registry.ts
import sendNotificationHandler from "./handlers/send-notification";

jobHandlerRegistry.register(sendNotificationHandler);
```

### 3. Adjust untuk Use Case Anda

#### a. Tambah Notification Type Baru

**Di `types/notifications.ts`:**
```typescript
export interface YourNewTemplateData extends BaseNotificationTemplateData {
    // Add your custom fields
    customField: string;
}
```

**Di `notification-templates.ts`:**
```typescript
export const notificationTemplates = {
    yourModule: {
        yourEvent: (data: YourNewTemplateData): NotificationTemplate => ({
            type: "informational",
            priority: "normal",
            title: "Your Title",
            message: `Your message with ${data.customField}`,
            emailSubject: "Your Email Subject",
            emailBody: `<html>Your HTML email body</html>`,
            whatsappMessage: `Your WhatsApp message`,
        }),
    },
};
```

**Buat service file baru:**
```typescript
// src/utils/notifications/your-notifications.ts
export interface YourNotificationData {
    // Define your data structure
}

export async function sendYourNotification(
    data: YourNotificationData,
): Promise<void> {
    const template = notificationTemplates.yourModule.yourEvent({
        // Map data to template
    });

    const payload: NotificationJobPayload = {
        inApp: { /* ... */ },
        email: { /* ... */ },
        whatsapp: { /* ... */ },
    };

    await jobQueueManager.createJob({
        type: "send-notification",
        priority: 100,
        payload,
        maxRetries: 3,
    });
}
```

#### b. Update Import Paths

Sesuaikan import paths dengan struktur folder project Anda:
```typescript
// Contoh adjustment
import jobQueueManager from "../../services/jobs/queue-manager";
import type { NotificationJobPayload } from "../../types/notifications";
```

#### c. Tambah Environment Variables

```env
FRONTEND_URL=https://your-domain.com
SENDMAIL_TO=your-email@domain.com
SENDMAIL_CC=cc1@domain.com,cc2@domain.com
PHONE_NUMBER_WAHA=628123456789
```

## Benefits

### ✅ Type Safety
- Semua data ter-type dengan TypeScript interfaces
- IDE autocomplete dan error checking
- Compile-time validation

### ✅ Self-Documenting
- Interface sebagai dokumentasi
- Clear function signatures
- No guessing parameter types

### ✅ Maintainable
- Centralized templates
- Separation of concerns
- Easy to extend

### ✅ Scalable
- Job queue untuk async processing
- Multi-channel support
- Retry mechanism

### ✅ Testable
- Pure functions untuk templates
- Mockable dependencies
- Clear interfaces

## Testing

```typescript
// Example unit test
describe("sendLeadClosedWinNotification", () => {
    it("should create job with correct payload", async () => {
        const mockData: LeadClosedWinNotificationData = {
            leadId: "lead-123",
            dealName: "Test Deal",
            companyName: "Test Company",
            salesId: "sales-123",
            salesName: "John Doe",
            estimatedPrice: "1000000",
            customerEmail: "customer@test.com",
            customerPhone: "08123456789",
            leadDetailUrl: "https://app.test.com/leads/123",
            sendToEmail: "admin@test.com",
            ccEmails: ["cc@test.com"],
        };

        await sendLeadClosedWinNotification(mockData);

        // Assert job queue was called with correct payload
        expect(jobQueueManager.createJob).toHaveBeenCalledWith({
            type: "send-notification",
            priority: 200,
            payload: expect.objectContaining({
                inApp: expect.any(Object),
                email: expect.any(Object),
            }),
            maxRetries: 3,
        });
    });
});
```

## Troubleshooting

### Issue: "Cannot find module '../notification-templates'"
**Solution**: TypeScript Language Server cache issue. Restart VS Code atau run:
```bash
# Verify file exists
ls -la src/utils/notification-templates.ts

# Test import at runtime
bun -e "import('./src/utils/notification-templates.ts').then(m => console.log(Object.keys(m)))"
```

### Issue: Type compatibility errors
**Solution**: Ensure `NotificationJobPayload` extends `Record<string, unknown>`:
```typescript
export interface NotificationJobPayload extends Record<string, unknown> {
    // ... fields
}
```

### Issue: Job handler not processing
**Solution**: Check registry registration:
```typescript
// Verify handler is registered
console.log(jobHandlerRegistry.has("send-notification")); // should be true
```

## Best Practices

1. **Always use typed interfaces** - Never use `any` or generic objects
2. **Handle errors gracefully** - Wrap notification calls in try-catch
3. **Log failures** - Use context.logger for job handler logging
4. **Set appropriate priority** - Critical notifications should have high priority
5. **Use job queue** - Don't send notifications synchronously in request handlers
6. **Test templates** - Verify email/WhatsApp content before deployment
7. **Monitor metrics** - Track notification success/failure rates

## Future Enhancements

- [ ] User notification preferences
- [ ] Notification batching
- [ ] Rate limiting per channel
- [ ] Template versioning
- [ ] A/B testing for templates
- [ ] Push notifications support
- [ ] SMS channel integration
- [ ] Notification analytics dashboard

## References

- [Job Queue Documentation](./jobs.md)
- [Email Service Documentation](./notifications.md)
- [TypeScript Best Practices](./best-practices.md)
