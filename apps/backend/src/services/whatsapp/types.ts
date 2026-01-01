/** WAHA webhook request parameters */
interface SendTextParams {
	/** WhatsApp chat ID (e.g., "628123456789@c.us") */
	chatId: string;
	/** Message ID to reply to */
	reply_to?: string | null;
	/** Message text content */
	text: string;
	/** Enable link preview in message */
	linkPreview?: boolean;
	/** Use high quality images in link preview */
	linkPreviewHighQuality?: boolean;
	/** WAHA session name */
	session?: string;
}

/** Response from WhatsApp service operations */
export interface WhatsAppResponse {
	/** Indicates if operation was successful */
	success: boolean;
	/** Error or status message */
	message?: string;
	/** Additional response data from WAHA */
	data?: unknown;
}

/** Parameters for sending notification via phone number */
export interface NotificationParams {
	/** Phone number (will be normalized to international format) */
	phoneNumber: string;
	/** Message text content */
	message: string;
	/** WAHA session name */
	session?: string;
	/** Enable link preview in message */
	linkPreview?: boolean;
	/** Use high quality images in link preview */
	linkPreviewHighQuality?: boolean;
}

/** Parameters for marking messages as seen */
interface SendSeenParams {
	/** WhatsApp chat ID */
	chatId: string;
	/** Array of message IDs to mark as seen */
	messageIds?: string[];
	/** Participant ID (for groups) */
	participant?: string | null;
	/** WAHA session name */
	session?: string;
}

/** Parameters for typing indicators */
interface TypingParams {
	/** WhatsApp chat ID */
	chatId: string;
	/** WAHA session name */
	session?: string;
}

/** Raw webhook payload structure from WAHA */
export interface WhatsAppWebhookPayload {
	/** Event type (e.g., "message", "message.ack") */
	event: string;
	/** WAHA session name */
	session: string;
	/** Event payload containing message details */
	payload: {
		/** Unique message ID */
		id: string;
		/** Unix timestamp in seconds */
		timestamp: number;
		/** Sender chat ID */
		from: string;
		/** True if message was sent by bot */
		fromMe: boolean;
		/** Message text content */
		body: string;
		/** True if message contains media */
		hasMedia: boolean;
		/** Message acknowledgment status */
		ack?: number;
		/** Additional metadata */
		_data?: {
			/** Sender's display name */
			notifyName?: string;
		};
	};
}

/** Simplified message context passed to handlers */
export interface WhatsAppMessageContext {
	/** Unique message ID */
	messageId: string;
	/** Chat ID where message was received */
	chatId: string;
	/** Sender chat ID */
	from: string;
	/** Message text content */
	body: string;
	/** Unix timestamp in seconds */
	timestamp: number;
	/** True if message was sent by bot */
	fromMe: boolean;
	/** True if message contains media */
	hasMedia: boolean;
	/** Sender's display name */
	senderName?: string;
	/** WAHA session name */
	session: string;
	/** Allow arbitrary additional properties for flexibility */
	// biome-ignore lint/suspicious/noExplicitAny: Flexibility for custom handler data
	[key: string]: any;
}

/** Handler function type for processing incoming messages */
export type WhatsAppMessageHandler = (
	context: WhatsAppMessageContext,
) => Promise<void> | void;

export type { SendTextParams, SendSeenParams, TypingParams };
