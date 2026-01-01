import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import appEnv from "../../appEnv";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import appLogger from "../../utils/logger";
import type { WhatsAppMessageContext } from "../whatsapp/types";
import whatsappService from "../whatsapp/whatsapp-service";
import { buildTransactionPrompt } from "./transaction-prompt";

const TARGET_CHAT_ID = "120363143296880650@g.us";

const openai = createOpenAI({
	apiKey: appEnv.OPENAI_API_KEY,
});

/**
 * Get user ID from username
 * @param username - The username to look up
 * @returns User ID or null if not found
 */
async function getUserIdByUsername(username: string): Promise<string | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.username, username),
		columns: { id: true },
	});
	return user?.id ?? null;
}

/**
 * Handler for transaction-related messages from specific WhatsApp group
 * Reacts with 🧪 emoji and uses AI to parse transaction details
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

		// Get user ID from username
		const userId = await getUserIdByUsername("superadmin");
		if (!userId) {
			appLogger.error(
				new Error(
					"[Transaction] User 'superadmin' not found in database",
				),
			);
			return;
		}

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

		// Skip AI processing if OPENAI_API_KEY is not configured
		if (!appEnv.OPENAI_API_KEY) {
			appLogger.info(
				"[Transaction] OpenAI API key not configured, skipping AI parsing",
			);
			return;
		}

		// Use AI to parse transaction details from the message
		appLogger.info("[Transaction] Parsing transaction with AI...");
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			prompt: await buildTransactionPrompt(context.body, userId),
			temperature: 0.1,
		});

		appLogger.info(`[Transaction] AI Response: ${text}`);

		// Try to parse the AI response as JSON
		try {
			// Strip markdown code blocks if present
			let cleanedText = text.trim();
			if (cleanedText.startsWith("```")) {
				// Remove opening ```json or ``` and closing ```
				cleanedText = cleanedText
					.replace(/^```(?:json)?\n?/, "")
					.replace(/\n?```$/, "")
					.trim();
			}

			const parsed = JSON.parse(cleanedText);
			appLogger.info(
				`[Transaction] Parsed transaction: ${JSON.stringify(parsed, null, 2)}`,
			);
		} catch (parseError) {
			appLogger.error(
				new Error(
					`[Transaction] Failed to parse AI response as JSON: ${text}`,
				),
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
