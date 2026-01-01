import appLogger from "../../utils/logger";
import type { WhatsAppMessageContext } from "../whatsapp/types";
import whatsappService from "../whatsapp/whatsapp-service";

const TARGET_CHAT_ID = "120363266486054443@g.us";

/**
 * Handler for transaction-related messages from specific WhatsApp group
 * Reacts with 🧪 emoji to messages from the target group
 */
export async function transactionWahaHandler(
	context: WhatsAppMessageContext,
): Promise<void> {
	// Only handle messages from the target group chat
	if (context.chatId !== TARGET_CHAT_ID) {
		return;
	}

	try {
		appLogger.info(
			`[Transaction] Message received from ${TARGET_CHAT_ID}: ${context.body}`,
		);

		// React to the message with 🧪 emoji
		const result = await whatsappService.sendReaction({
			messageId: context.messageId,
			reaction: "🧪",
			session: context.session,
		});

		if (result.success) {
			appLogger.info(
				`[Transaction] Successfully reacted to message ${context.messageId}`,
			);
		} else {
			appLogger.error(
				new Error(`[Transaction] Failed to react: ${result.message}`),
			);
		}
	} catch (error) {
		appLogger.error(
			new Error(
				`[Transaction] Error processing message: ${error instanceof Error ? error.message : "Unknown error"}`,
			),
		);
	}
}
