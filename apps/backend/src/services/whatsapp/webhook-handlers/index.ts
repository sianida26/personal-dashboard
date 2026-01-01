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

	const registeredHandlers = whatsappService.getHandlerNames();
	appLogger.info(
		`WhatsApp handlers registered: ${registeredHandlers.join(", ")}`,
	);
}
