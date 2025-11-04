interface SendTextParams {
	chatId: string;
	reply_to?: string | null;
	text: string;
	linkPreview?: boolean;
	linkPreviewHighQuality?: boolean;
	session?: string;
}

export interface WhatsAppResponse {
	success: boolean;
	message?: string;
	data?: unknown;
}

export interface NotificationParams {
	phoneNumber: string;
	message: string;
	session?: string;
	linkPreview?: boolean;
	linkPreviewHighQuality?: boolean;
}

export class WhatsAppService {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly defaultSession: string;

	constructor() {
		this.apiKey = process.env.WAHA_API_KEY || "";
		this.baseUrl = process.env.WAHA_BASE_URL || "https://waha.dsg.id";
		this.defaultSession = process.env.WAHA_SESSION || "default";

		if (!this.apiKey) {
			console.warn("WAHA API key not configured");
		}
	}

	isReady(): boolean {
		return Boolean(this.apiKey);
	}

	private async sendText(params: SendTextParams): Promise<WhatsAppResponse> {
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
