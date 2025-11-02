/**
 * Notification job payload types
 */

// Email notification payload
export interface EmailNotificationPayload {
	to: string[];
	subject: string;
	html: string;
	text?: string;
	cc?: string[];
	bcc?: string[];
}

// WhatsApp notification payload
export interface WhatsAppNotificationPayload {
	phoneNumber: string;
	message: string;
	metadata?: Record<string, unknown>;
}

// Union type for all notification job payloads
export type NotificationJobPayload =
	| { email: EmailNotificationPayload }
	| { whatsapp: WhatsAppNotificationPayload };

// Notification channel type
export type NotificationChannel = "inApp" | "email" | "whatsapp" | "push";
