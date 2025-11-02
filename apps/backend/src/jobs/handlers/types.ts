/**
 * Job Handler Payload Types
 *
 * Type definitions for job handler payloads.
 * Separated from handler implementations to avoid circular dependencies.
 */

import type { CreateNotificationInput } from "@repo/validation";
import type { JobPriority } from "../../services/jobs/types";

/**
 * In-app notification job payload
 */
export interface InAppNotificationJobPayload extends Record<string, unknown> {
	notification: CreateNotificationInput & {
		priority?: JobPriority;
	};
}

/**
 * Email notification job payload
 */
export interface EmailNotificationJobPayload extends Record<string, unknown> {
	email: {
		to: string[];
		subject: string;
		html: string;
		text?: string;
		cc?: string[];
		bcc?: string[];
		metadata?: Record<string, unknown>;
		body?: string;
	};
}

/**
 * WhatsApp notification job payload
 */
export interface WhatsAppNotificationJobPayload
	extends Record<string, unknown> {
	whatsapp: {
		phoneNumber: string;
		message: string;
		metadata?: Record<string, unknown>;
	};
}

/**
 * Data processing job payload
 */
export interface DataProcessingJobPayload extends Record<string, unknown> {
	data: unknown;
	processingType: string;
}
