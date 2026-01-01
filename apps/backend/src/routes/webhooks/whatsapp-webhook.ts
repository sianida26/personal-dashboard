import { Hono } from "hono";
import type { WhatsAppWebhookPayload } from "../../services/whatsapp/types";
import whatsappService from "../../services/whatsapp/whatsapp-service";
import type HonoEnv from "../../types/HonoEnv";
import appLogger from "../../utils/logger";

const whatsappWebhookRoute = new Hono<HonoEnv>();

// Flag to track if handlers are loaded
let handlersLoaded = false;

/**
 * Lazy-load WhatsApp handlers on first webhook request
 */
async function ensureHandlersLoaded() {
	if (handlersLoaded) return;

	try {
		const { registerWhatsAppHandlers } = await import(
			"../../services/whatsapp/webhook-handlers"
		);
		registerWhatsAppHandlers();
		handlersLoaded = true;
		appLogger.info("WhatsApp handlers loaded on first webhook request");
	} catch (error) {
		appLogger.error(
			new Error(
				`Failed to load WhatsApp handlers: ${error instanceof Error ? error.message : "Unknown error"}`,
			),
		);
	}
}

/**
 * WhatsApp webhook endpoint
 * Receives incoming messages from WAHA (WhatsApp HTTP API)
 * POST /webhooks/whatsapp
 */
whatsappWebhookRoute.post("/", async (c) => {
	try {
		// Ensure handlers are loaded
		await ensureHandlersLoaded();

		const payload = await c.req.json<WhatsAppWebhookPayload>();

		// Only process message events
		if (payload.event === "message") {
			await whatsappService.processIncomingMessage(payload);
		}

		return c.json({ success: true });
	} catch (error) {
		appLogger.error(
			new Error(
				`WhatsApp webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			),
		);

		// Return 200 to prevent WAHA from retrying
		return c.json({ success: false, error: "Internal processing error" });
	}
});

export default whatsappWebhookRoute;
