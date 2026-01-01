import appLogger from "../../utils/logger";
import normalizePhoneNumber from "../../utils/normalizePhoneNumber";
import type {
	NotificationParams,
	SendSeenParams,
	SendTextParams,
	TypingParams,
	WhatsAppMessageContext,
	WhatsAppMessageHandler,
	WhatsAppResponse,
	WhatsAppWebhookPayload,
} from "./types";

export type {
	NotificationParams,
	WhatsAppMessageContext,
	WhatsAppMessageHandler,
	WhatsAppResponse,
	WhatsAppWebhookPayload,
};

/**
 * WhatsApp Service for sending messages and managing webhook handlers
 *
 * This service integrates with WAHA (WhatsApp HTTP API) to:
 * - Send WhatsApp messages
 * - Process incoming webhook messages
 * - Manage message handlers for automated responses
 *
 * @example
 * ```typescript
 * // Send a message
 * const result = await whatsappService.sendNotification({
 *   phoneNumber: "08123456789",
 *   message: "Hello!"
 * });
 *
 * // Register a handler
 * whatsappService.registerHandler("myHandler", async (context) => {
 *   if (context.body.includes("hello")) {
 *     await whatsappService.sendText({
 *       chatId: context.chatId,
 *       text: "Hi there!"
 *     });
 *   }
 * });
 * ```
 */
export class WhatsAppService {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly defaultSession: string;
	private handlers: Map<string, WhatsAppMessageHandler> = new Map();

	/**
	 * Initialize WhatsApp service with configuration from environment variables
	 *
	 * Required environment variables:
	 * - WAHA_API_KEY: API key for WAHA authentication
	 * - WAHA_BASE_URL: Base URL of WAHA instance (default: https://waha.dsg.id)
	 * - WAHA_SESSION: Default session name (default: "default")
	 */
	constructor() {
		this.apiKey = process.env.WAHA_API_KEY || "";
		this.baseUrl = process.env.WAHA_BASE_URL || "https://waha.dsg.id";
		this.defaultSession = process.env.WAHA_SESSION || "default";
	}

	/**
	 * Check if WhatsApp service is ready to use
	 *
	 * @returns True if API key is configured, false otherwise
	 */
	isReady(): boolean {
		return Boolean(this.apiKey);
	}

	/**
	 * Register a message handler by name
	 *
	 * Handlers are executed when incoming messages are received via webhook.
	 * Multiple handlers can be registered and will be executed in order.
	 *
	 * @param name - Unique identifier for the handler
	 * @param handler - Function to handle incoming messages
	 *
	 * @example
	 * ```typescript
	 * whatsappService.registerHandler("greeting", async (context) => {
	 *   if (context.body.toLowerCase() === "hello") {
	 *     await whatsappService.sendText({
	 *       chatId: context.chatId,
	 *       text: "Hello!"
	 *     });
	 *   }
	 * });
	 * ```
	 */
	registerHandler(name: string, handler: WhatsAppMessageHandler): void {
		this.handlers.set(name, handler);
	}

	/**
	 * Unregister a message handler by name
	 *
	 * @param name - Handler identifier to remove
	 * @returns True if handler was found and removed, false otherwise
	 */
	unregisterHandler(name: string): boolean {
		return this.handlers.delete(name);
	}

	/**
	 * Get all registered handler names
	 *
	 * @returns Array of handler names
	 */
	getHandlerNames(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * Process incoming webhook message
	 *
	 * Executes all registered handlers with the message context.
	 * Messages sent by the bot (fromMe: true) are skipped.
	 * If a handler fails, the error is logged and other handlers continue.
	 *
	 * @param payload - Raw webhook payload from WAHA
	 */
	async processIncomingMessage(
		payload: WhatsAppWebhookPayload,
	): Promise<void> {
		// Skip messages sent by us
		if (payload.payload.fromMe) {
			return;
		}

		// Build simplified context for handlers
		const context: WhatsAppMessageContext = {
			messageId: payload.payload.id,
			chatId: payload.payload.from,
			from: payload.payload.from,
			body: payload.payload.body || "",
			timestamp: payload.payload.timestamp,
			fromMe: payload.payload.fromMe,
			hasMedia: payload.payload.hasMedia,
			senderName: payload.payload._data?.notifyName,
			session: payload.session,
		};

		// Execute all handlers
		for (const [name, handler] of this.handlers) {
			try {
				await handler(context);
			} catch (error) {
				console.error(`WhatsApp handler "${name}" failed:`, error);
				// Continue with other handlers even if one fails
			}
		}
	}

	/**
	 * Send a text message to a WhatsApp chat
	 *
	 * This method simulates natural human behavior:
	 * 1. Marks message as seen (if reply_to provided)
	 * 2. Random delay (500-1500ms)
	 * 3. Shows typing indicator
	 * 4. Random delay (1000-3000ms)
	 * 5. Sends message
	 * 6. Stops typing indicator
	 *
	 * @param params - Message parameters
	 * @param params.chatId - WhatsApp chat ID (e.g., "628123456789@c.us")
	 * @param params.text - Message text content
	 * @param params.reply_to - Message ID to reply to (optional)
	 * @param params.linkPreview - Enable link preview (default: true)
	 * @param params.linkPreviewHighQuality - Use high quality link preview (default: false)
	 * @param params.session - WAHA session name (default: from env)
	 * @returns Response object with success status and optional data
	 *
	 * @example
	 * ```typescript
	 * const result = await whatsappService.sendText({
	 *   chatId: "628123456789@c.us",
	 *   text: "Hello World!",
	 *   linkPreview: true
	 * });
	 *
	 * if (result.success) {
	 *   console.log("Message sent:", result.data);
	 * } else {
	 *   console.error("Failed:", result.message);
	 * }
	 * ```
	 */
	async sendText(params: SendTextParams): Promise<WhatsAppResponse> {
		const sessionToUse = params.session || this.defaultSession;

		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		try {
			// Step 1: Send seen if replying to a message
			const seenResult = await this.sendSeen({
				chatId: params.chatId,
				// messageIds: [params.chatId],
				session: sessionToUse,
			});
			appLogger.info(
				`SendSeen result: success=${seenResult.success}, message=${seenResult.message}`,
			);

			// Step 2: Random delay (500-1500ms)
			await new Promise((resolve) =>
				setTimeout(resolve, 500 + Math.random() * 1000),
			);

			// Step 3: Start typing
			await this.startTyping({
				chatId: params.chatId,
				session: sessionToUse,
			});

			// Step 4: Random delay (1000-3000ms) - simulates typing time
			await new Promise((resolve) =>
				setTimeout(resolve, 1000 + Math.random() * 2000),
			);

			// Step 5: Send the message
			const payload = {
				chatId: params.chatId,
				reply_to: params.reply_to ?? null,
				text: params.text,
				linkPreview: params.linkPreview ?? true,
				linkPreviewHighQuality: params.linkPreviewHighQuality ?? false,
				session: sessionToUse,
			};

			const response = await fetch(`${this.baseUrl}/api/sendText`, {
				method: "POST",
				headers: {
					accept: "application/json",
					"X-Api-Key": this.apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			// Step 6: Stop typing
			await this.stopTyping({
				chatId: params.chatId,
				session: sessionToUse,
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					message: `Failed to send WhatsApp message: ${response.status} ${errorText}`,
				};
			}

			const result = await response.json();
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			// Stop typing on error
			try {
				await this.stopTyping({
					chatId: params.chatId,
					session: sessionToUse,
				});
			} catch {
				// Ignore error when stopping typing
			}

			return {
				success: false,
				message: `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Send a notification message to a phone number
	 *
	 * This is a convenience method that normalizes phone numbers to Indonesian format
	 * and sends the message. Phone numbers are automatically formatted:
	 * - Removes non-digit characters
	 * - Removes leading "+" if present
	 * - Adds "62" prefix for Indonesian numbers if needed
	 * - Converts to WhatsApp chat ID format
	 *
	 * @param params - Notification parameters
	 * @param params.phoneNumber - Phone number (will be normalized)
	 * @param params.message - Message text content
	 * @param params.session - WAHA session name (optional)
	 * @param params.linkPreview - Enable link preview (optional)
	 * @param params.linkPreviewHighQuality - Use high quality link preview (optional)
	 * @returns Response object with success status and optional data
	 *
	 * @example
	 * ```typescript
	 * // All these formats work:
	 * await whatsappService.sendNotification({
	 *   phoneNumber: "08123456789",  // Will be converted to 628123456789
	 *   message: "Hello!"
	 * });
	 *
	 * await whatsappService.sendNotification({
	 *   phoneNumber: "+628123456789",
	 *   message: "Hello!"
	 * });
	 * ```
	 */
	async sendNotification(
		params: NotificationParams,
	): Promise<WhatsAppResponse> {
		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		const phoneNumber = normalizePhoneNumber(params.phoneNumber);
		const chatId = `${phoneNumber}@c.us`;

		return this.sendText({
			chatId,
			text: params.message,
			linkPreview: params.linkPreview,
			linkPreviewHighQuality: params.linkPreviewHighQuality,
			session: params.session,
		});
	}

	/**
	 * Mark messages as seen (read)
	 *
	 * @param params - Parameters for marking messages as seen
	 * @param params.chatId - WhatsApp chat ID
	 * @param params.messageIds - Array of message IDs to mark as seen
	 * @param params.participant - Participant ID for group chats (optional)
	 * @param params.session - WAHA session name (default: from env)
	 * @returns Response object with success status
	 *
	 * @example
	 * ```typescript
	 * const result = await whatsappService.sendSeen({
	 *   chatId: "628123456789@c.us",
	 *   messageIds: ["false_628123456789@c.us_AAAAAAAA"]
	 * });
	 * ```
	 */
	async sendSeen(params: SendSeenParams): Promise<WhatsAppResponse> {
		const sessionToUse = params.session || this.defaultSession;
		const payload = {
			chatId: params.chatId,
			messageIds: params.messageIds ?? [],
			participant: params.participant ?? null,
			session: sessionToUse,
		};

		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		try {
			const response = await fetch(`${this.baseUrl}/api/sendSeen`, {
				method: "POST",
				headers: {
					accept: "application/json",
					"X-Api-Key": this.apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					message: `Failed to send seen: ${response.status} ${errorText}`,
				};
			}

			const result = await response.json();
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			return {
				success: false,
				message: `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Start showing typing indicator in a chat
	 *
	 * @param params - Parameters for typing indicator
	 * @param params.chatId - WhatsApp chat ID
	 * @param params.session - WAHA session name (default: from env)
	 * @returns Response object with success status
	 *
	 * @example
	 * ```typescript
	 * await whatsappService.startTyping({
	 *   chatId: "628123456789@c.us"
	 * });
	 * ```
	 */
	async startTyping(params: TypingParams): Promise<WhatsAppResponse> {
		const sessionToUse = params.session || this.defaultSession;
		const payload = {
			chatId: params.chatId,
			session: sessionToUse,
		};

		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		try {
			const response = await fetch(`${this.baseUrl}/api/startTyping`, {
				method: "POST",
				headers: {
					accept: "application/json",
					"X-Api-Key": this.apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					message: `Failed to start typing: ${response.status} ${errorText}`,
				};
			}

			const result = await response.json();
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			return {
				success: false,
				message: `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Stop showing typing indicator in a chat
	 *
	 * @param params - Parameters for typing indicator
	 * @param params.chatId - WhatsApp chat ID
	 * @param params.session - WAHA session name (default: from env)
	 * @returns Response object with success status
	 *
	 * @example
	 * ```typescript
	 * await whatsappService.stopTyping({
	 *   chatId: "628123456789@c.us"
	 * });
	 * ```
	 */
	async stopTyping(params: TypingParams): Promise<WhatsAppResponse> {
		const sessionToUse = params.session || this.defaultSession;
		const payload = {
			chatId: params.chatId,
			session: sessionToUse,
		};

		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		try {
			const response = await fetch(`${this.baseUrl}/api/stopTyping`, {
				method: "POST",
				headers: {
					accept: "application/json",
					"X-Api-Key": this.apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					message: `Failed to stop typing: ${response.status} ${errorText}`,
				};
			}

			const result = await response.json();
			return {
				success: true,
				data: result,
			};
		} catch (error) {
			return {
				success: false,
				message: `Internal error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}
}

const whatsappService = new WhatsAppService();

export default whatsappService;
