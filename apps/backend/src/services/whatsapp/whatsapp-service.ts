/**
 * WhatsApp service for sending messages via WAHA API
 * Uses native Node.js 18+ fetch API (no external dependency needed)
 */

export interface WhatsAppMessage {
	chatId: string;
	text: string;
	replyTo?: string;
}

export interface WhatsAppResponse {
	success: boolean;
	messageId?: string;
	error?: string;
}

export class WhatsAppService {
	private apiUrl: string;
	private apiToken: string;
	private isConfigured = false;

	constructor() {
		this.apiUrl = process.env.WAHA_API_URL || "http://localhost:3001";
		this.apiToken = process.env.WAHA_API_TOKEN || "";

		if (!this.apiToken) {
			console.warn(
				"WhatsApp service not configured. Please set WAHA_API_URL and WAHA_API_TOKEN environment variables.",
			);
			return;
		}

		this.isConfigured = true;
	}

	async sendMessage(
		phoneNumber: string,
		message: string,
	): Promise<WhatsAppResponse> {
		if (!this.isConfigured) {
			return {
				success: false,
				error: "WhatsApp service not configured",
			};
		}

		try {
			// Format phone number: ensure it has country code (e.g., +1234567890)
			const chatId = phoneNumber.startsWith("+")
				? phoneNumber.replace("+", "")
				: phoneNumber;

			const response = await fetch(`${this.apiUrl}/api/sendMessage`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiToken}`,
				},
				body: JSON.stringify({
					chatId: `${chatId}@c.us`,
					text: message,
				}),
			});

			if (!response.ok) {
				return {
					success: false,
					error: `WhatsApp API error: ${response.statusText}`,
				};
			}

			const data = (await response.json()) as {
				id?: string;
				error?: string;
			};

			if (data.error) {
				return {
					success: false,
					error: data.error,
				};
			}

			return {
				success: true,
				messageId: data.id,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async checkHealth(): Promise<boolean> {
		if (!this.isConfigured) {
			return false;
		}

		try {
			const response = await fetch(`${this.apiUrl}/api/status`, {
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			return response.ok;
		} catch (error) {
			console.error("WhatsApp service health check failed:", error);
			return false;
		}
	}
}

const whatsappService = new WhatsAppService();

export default whatsappService;
