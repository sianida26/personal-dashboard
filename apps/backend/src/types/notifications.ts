/**
 * Notification job payload types and utilities
 */

import type { CreateNotificationInput } from "@repo/validation";

// In-app notification payload
export interface InAppNotificationPayload
	extends Partial<CreateNotificationInput> {
	priority?: string;
}

// Email notification payload
export interface EmailNotificationPayload {
	to: string[];
	subject: string;
	html: string;
	text?: string;
	cc?: string[];
	bcc?: string[];
	metadata?: Record<string, unknown>;
	body?: string;
}

// WhatsApp notification payload
export interface WhatsAppNotificationPayload {
	phoneNumber: string;
	message: string;
	metadata?: Record<string, unknown>;
	session?: string;
	linkPreview?: boolean;
	linkPreviewHighQuality?: boolean;
}

// Union type for all notification job payloads
export type NotificationJobPayload =
	| { email: EmailNotificationPayload }
	| { whatsapp: WhatsAppNotificationPayload };

// Notification channel type
// Note: inApp includes browser native push notifications
export type NotificationChannel = "inApp" | "email" | "whatsapp";

// Notification priority type
export type NotificationPriority = "low" | "normal" | "high";
