import type {
	NotificationParams,
	SendTextParams,
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

export class WhatsAppService {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly defaultSession: string;
	private handlers: Map<string, WhatsAppMessageHandler> = new Map();

	constructor() {
		this.apiKey = process.env.WAHA_API_KEY || "";
		this.baseUrl = process.env.WAHA_BASE_URL || "https://waha.dsg.id";
		this.defaultSession = process.env.WAHA_SESSION || "default";
	}

	isReady(): boolean {
		return Boolean(this.apiKey);
	}

	/**
	 * Register a message handler by name
	 * @param name Unique identifier for the handler
	 * @param handler Function to handle incoming messages
	 */
	registerHandler(name: string, handler: WhatsAppMessageHandler): void {
		this.handlers.set(name, handler);
	}

	/**
	 * Unregister a message handler by name
	 * @param name Handler identifier to remove
	 */
	unregisterHandler(name: string): boolean {
		return this.handlers.delete(name);
	}

	/**
	 * Get all registered handler names
	 */
	getHandlerNames(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * Process incoming webhook message
	 * Executes all registered handlers with the message context
	 * @param payload Raw webhook payload from WAHA
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

	async sendText(params: SendTextParams): Promise<WhatsAppResponse> {
		const sessionToUse = params.session || this.defaultSession;
		const payload = {
			chatId: params.chatId,
			reply_to: params.reply_to ?? null,
			text: params.text,
			linkPreview: params.linkPreview ?? true,
			linkPreviewHighQuality: params.linkPreviewHighQuality ?? false,
			session: sessionToUse,
		};

		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		try {
			const response = await fetch(`${this.baseUrl}/api/sendText`, {
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
					message: `Failed to send WhatsApp message: ${response.status} ${errorText}`,
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

	async sendNotification(
		params: NotificationParams,
	): Promise<WhatsAppResponse> {
		if (!this.apiKey) {
			return {
				success: false,
				message: "WhatsApp API key not configured",
			};
		}

		let phoneNumber = params.phoneNumber.trim();
		if (phoneNumber.startsWith("+")) {
			phoneNumber = phoneNumber.substring(1);
		}
		phoneNumber = phoneNumber.replace(/\D/g, "");

		if (
			!phoneNumber.startsWith("62") &&
			!phoneNumber.startsWith("1") &&
			!phoneNumber.startsWith("65")
		) {
			if (phoneNumber.startsWith("0")) {
				phoneNumber = "62" + phoneNumber.substring(1);
			} else {
				phoneNumber = "62" + phoneNumber;
			}
		}

		const chatId = `${phoneNumber}@c.us`;

		return this.sendText({
			chatId,
			text: params.message,
			linkPreview: params.linkPreview,
			linkPreviewHighQuality: params.linkPreviewHighQuality,
			session: params.session,
		});
	}
}

const whatsappService = new WhatsAppService();

export default whatsappService;
