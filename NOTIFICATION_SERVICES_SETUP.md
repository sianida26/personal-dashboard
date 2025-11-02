# Multi-Channel Notification Services Setup

This guide explains how to set up and configure real email and WhatsApp notification services for production use.

## Overview

The notification system now supports three channels:
1. **In-App Notifications** - Instant, real-time notifications via SSE and browser notifications
2. **Email Notifications** - Emails via SMTP (Gmail, SendGrid, AWS SES, etc.)
3. **WhatsApp Notifications** - WhatsApp messages via WAHA (WhatsApp HTTP API)

By default, **all three channels are enabled** for all notification categories. Users can disable specific channels in their notification preferences.

---

## 1. Email Notifications Setup

### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to myaccount.google.com
   - Select "Security" from the left menu
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password

3. **Configure .env**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=Dashboard Notifications
   ```

### Option B: SendGrid

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com/
   - Create an API key

2. **Configure .env**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-sendgrid-api-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   SMTP_FROM_NAME=Dashboard Notifications
   ```

### Option C: AWS SES

1. **Set Up AWS SES**
   - Go to AWS Console > SES
   - Verify sender email address
   - Request production access
   - Create SMTP credentials

2. **Configure .env**
   ```bash
   SMTP_HOST=email-smtp.region.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your-aws-ses-username
   SMTP_PASS=your-aws-ses-password
   SMTP_FROM_EMAIL=verified-email@yourdomain.com
   SMTP_FROM_NAME=Dashboard Notifications
   ```

### Testing Email Configuration

```bash
# In your application code or via curl
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "informational",
    "title": "Test Email",
    "message": "This is a test email notification",
    "userId": "test-user-id",
    "channels": ["email"],
    "category": "system"
  }'
```

---

## 2. WhatsApp Notifications Setup

### Deploy WAHA

WAHA (WhatsApp HTTP API) is a self-hosted solution to send WhatsApp messages.

#### Option A: Docker Compose (Easiest)

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     waha:
       image: devlikeapro/waha-latest:latest
       ports:
         - "3001:3001"
       environment:
         WHATSAPP_USERS: "admin"
         WHATSAPP_USERS_DEFAULT_ADMIN: "true"
         API_KEY_ADMIN: "your-secure-api-key"
       volumes:
         - ./waha_data:/app/.waha
   ```

2. **Start WAHA**
   ```bash
   docker-compose up -d
   ```

3. **Configure .env**
   ```bash
   WAHA_API_URL=http://localhost:3001
   WAHA_API_TOKEN=your-secure-api-key
   ```

#### Option B: Manual Installation

1. **Clone WAHA Repository**
   ```bash
   git clone https://github.com/devlikeapro/whatsapp-http-api.git
   cd whatsapp-http-api
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure**
   - Create `.env` file with API key
   - Start the service: `npm run start`

### Linking WhatsApp Account

1. **Access WAHA Dashboard**
   - Open http://localhost:3001
   - Log in with admin credentials

2. **Scan QR Code**
   - Get your WhatsApp linked
   - WAHA will show a QR code to scan with WhatsApp

3. **Verify Connection**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     http://localhost:3001/api/status
   ```

### Testing WhatsApp Configuration

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "informational",
    "title": "Test WhatsApp",
    "message": "This is a test WhatsApp notification",
    "userId": "test-user-id",
    "channels": ["whatsapp"],
    "category": "system"
  }'
```

---

## 3. Browser Notifications (In-App)

### How It Works

1. **Permission Request** - App automatically requests notification permission on first load
2. **Real-Time Delivery** - SSE stream sends notifications instantly
3. **Native Display** - Browser shows native OS notifications
4. **Toast Fallback** - Also shows toast message in app

### Users Can Control

Users can manage notification preferences:
1. Go to Settings > Notification Preferences
2. Enable/disable channels per category
3. Disable entire channels if not wanted

---

## 4. Multi-Channel Example

### Send to All Channels

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "informational",
    "title": "Important Update",
    "message": "Your profile was updated successfully",
    "userId": "user-123",
    "channels": ["inApp", "email", "whatsapp"],
    "category": "system"
  }'
```

### Send to Specific Channels

```bash
# Email only
{
  "channels": ["email"]
}

# In-app and email, skip WhatsApp
{
  "channels": ["inApp", "email"]
}

# WhatsApp and in-app
{
  "channels": ["whatsapp", "inApp"]
}
```

### Respecting User Preferences

By default, the system respects user preferences:
```bash
# This respects preferences (skip disabled channels)
{
  "channels": ["inApp", "email", "whatsapp"],
  "respectPreferences": true  # default
}

# Force send regardless of preferences (admin only)
{
  "channels": ["inApp", "email", "whatsapp"],
  "respectPreferences": false
}
```

---

## 5. Environment Configuration Reference

### Email Configuration
```bash
# SMTP Server
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Sender Details
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Dashboard Notifications
```

### WhatsApp Configuration
```bash
# WAHA Server
WAHA_API_URL=http://localhost:3001
WAHA_API_TOKEN=your-api-key
```

---

## 6. Email Template Customization

### Current HTML Template

The system generates simple HTML emails with:
- Title as heading
- Message as body
- Category badge
- Footer with disclaimer

### Customizing Templates

To customize email templates, modify the `createEmailHtml()` function in:
```
apps/backend/src/modules/notifications/channels/email-adapter.ts
```

Example: Add company logo, custom styling, etc.

---

## 7. Testing & Monitoring

### Check Service Status

```bash
# Check if services are configured
curl http://localhost:3000/api/health

# Response includes job queue status and available handlers
```

### Monitor Jobs

```bash
# Check pending jobs
SELECT * FROM jobs WHERE status = 'pending';

# Check completed jobs
SELECT * FROM jobs WHERE status = 'completed' AND type LIKE '%notification%';

# Check failed jobs
SELECT * FROM jobs WHERE status = 'failed' AND createdAt > NOW() - INTERVAL '1 hour';
```

### Debug Logs

Enable debug logging in `.env`:
```bash
LOG_DEBUG=true
```

Then check logs for:
- Email sending attempts
- WhatsApp API calls
- Job processing

---

## 8. Troubleshooting

### Email Not Sending

**Problem:** Gmail says "Less secure app access"
```
Solution: Use App Password instead of regular password
```

**Problem:** SMTP connection timeout
```
Solution: Check firewall, verify SMTP_HOST and SMTP_PORT are correct
```

**Problem:** "Invalid sender" error
```
Solution: Verify SMTP_FROM_EMAIL matches or is verified in service
```

### WhatsApp Not Sending

**Problem:** WAHA server not responding
```
Solution: Check if Docker container is running
docker ps | grep waha
```

**Problem:** Invalid phone number format
```
Solution: Phone numbers must be in format: +1234567890 or 1234567890
```

**Problem:** "API token invalid" error
```
Solution: Verify WAHA_API_TOKEN matches your configured token
```

---

## 9. Production Checklist

Before deploying to production:

- [ ] Email service configured with production SMTP server
- [ ] SMTP credentials secured in environment variables (not in code)
- [ ] WAHA deployed and linked to production WhatsApp account
- [ ] WAHA API token secured
- [ ] Database backups configured
- [ ] Monitoring/alerting set up for failed jobs
- [ ] Email templates customized with branding
- [ ] Test email and WhatsApp sent successfully
- [ ] User notification preferences working
- [ ] SSE connection stable for in-app notifications
- [ ] Rate limiting configured on notification endpoints
- [ ] Logging enabled for audit trail

---

## 10. Architecture Overview

```
User Sends Notification
        ↓
API Route (POST /api/notifications)
        ↓
Helper Function (sendToUsersAndRoles)
        ↓
UnifiedNotificationService
        ├─ Resolve recipients
        ├─ Filter by preferences
        └─ For each enabled channel:
           ├─ InApp Adapter → in-app-notification job
           ├─ Email Adapter → email-notification job
           └─ WhatsApp Adapter → whatsapp-notification job
        ↓
Job Queue (Database)
        ↓
Worker Pool (5 workers)
        ├─ Picks up pending job
        ├─ Finds handler
        └─ Executes handler
        ↓
Handlers Execute
├─ inAppNotificationHandler
│  ├─ Create DB record
│  ├─ Emit SSE event
│  └─ Browser shows notification
│
├─ emailNotificationHandler
│  ├─ Format HTML email
│  ├─ Connect to SMTP
│  └─ Send email
│
└─ whatsappNotificationHandler
   ├─ Format message
   ├─ Call WAHA API
   └─ Send WhatsApp
```

---

## 11. Code Examples

### Send Notification Programmatically

```typescript
import { sendToUsersAndRoles } from "@/utils/notifications/notification-helpers";

// Send to all channels
await sendToUsersAndRoles({
  userIds: ["user-1", "user-2"],
  roleCodes: ["admin"],
  title: "Important Update",
  message: "Your action was completed",
  category: "system",
  type: "informational",
  channels: ["inApp", "email", "whatsapp"],
  respectPreferences: true,
});
```

### Check Job Status

```typescript
import db from "@/drizzle";
import { jobs } from "@/drizzle/schema/jobs";

// Get recent email jobs
const emailJobs = await db
  .select()
  .from(jobs)
  .where(eq(jobs.type, "email-notification"))
  .orderBy(desc(jobs.createdAt))
  .limit(10);

console.log(emailJobs);
// Output: [{id, type, status, payload, createdAt, ...}]
```

---

## 12. Support & Resources

### Documentation
- Email Service: `services/email/email-service.ts`
- WhatsApp Service: `services/whatsapp/whatsapp-service.ts`
- Email Handler: `jobs/handlers/email-notification.ts`
- WhatsApp Handler: `jobs/handlers/whatsapp-notification.ts`
- Notification System: See `NOTIFICATION_FLOW_EXPLAINED.md`

### External Resources
- **Nodemailer Docs**: https://nodemailer.com/
- **SendGrid Docs**: https://docs.sendgrid.com/
- **AWS SES Docs**: https://docs.aws.amazon.com/ses/
- **WAHA Project**: https://github.com/devlikeapro/whatsapp-http-api
- **Notification API**: https://developer.mozilla.org/en-US/docs/Web/API/Notification

---

## Quick Start (Development)

```bash
# 1. Set up Gmail for testing
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Dashboard

# 2. (Optional) Set up WAHA
docker run -it -p 3001:3001 devlikeapro/waha-latest:latest

# 3. Configure WAHA in .env
WAHA_API_URL=http://localhost:3001
WAHA_API_TOKEN=your-api-key

# 4. Start your app
npm run dev

# 5. Send test notification
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "informational",
    "title": "Test",
    "message": "Hello from notifications",
    "userId": "test-user",
    "channels": ["inApp", "email", "whatsapp"],
    "category": "system"
  }'
```

---

**Status:** ✅ Production-Ready

All notification services are now ready for production deployment.
