import appLogger from "../../../utils/logger";
import whatsappService from "../whatsapp-service";
/**
 * Register all WhatsApp message handlers
 * This should be called when webhook receives first request
 */
export function registerWhatsAppHandlers(): void {
	appLogger.info("Registering WhatsApp message handlers");

	// Register example handlers
	// whatsappService.registerHandler("greeting", greetingHandler);
	// whatsappService.registerHandler("help", helpHandler);
	whatsappService.registerHandler("health-check", async (context) => {
		appLogger.info(
			`Health-check handler: body="${context.body}", chatId="${context.chatId}", endsWith=${context.chatId.endsWith("@c.us")}`,
		);

		// Only respond to "/test" in personal chats (not groups)
		if (context.body === "/test" && context.chatId.endsWith("@c.us")) {
			appLogger.info("Sending reply: I'm up");
			const result = await whatsappService.sendText({
				chatId: context.chatId,
				text: "I'm up",
				reply_to: context.messageId, // Reply to the incoming message (triggers sendSeen)
				session: context.session, // Use the incoming session
			});
			appLogger.info(`Send result: ${JSON.stringify(result)}`);
		}
	});

	const registeredHandlers = whatsappService.getHandlerNames();
	appLogger.info(
		`WhatsApp handlers registered: ${registeredHandlers.join(", ")}`,
	);
}
