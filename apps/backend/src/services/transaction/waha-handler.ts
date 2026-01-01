import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { and, eq, sql } from "drizzle-orm";
import appEnv from "../../appEnv";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { users } from "../../drizzle/schema/users";
import appLogger from "../../utils/logger";
import type { WhatsAppMessageContext } from "../whatsapp/types";
import whatsappService from "../whatsapp/whatsapp-service";
import { buildTransactionPrompt } from "./transaction-prompt";

const TARGET_CHAT_ID = "120363266486054443@g.us";

// sandbox
// const TARGET_CHAT_ID = "120363143296880650@g.us";

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
 * Get a default account for the user (first active account, or create one if none exists)
 * @param userId - The user ID to get/create account for
 * @returns Account ID
 */
async function getOrCreateDefaultAccount(userId: string): Promise<string> {
	// Try to find an existing active account
	const existingAccount = await db.query.moneyAccounts.findFirst({
		where: and(
			eq(moneyAccounts.userId, userId),
			eq(moneyAccounts.isActive, true),
		),
		columns: { id: true },
	});

	if (existingAccount) {
		return existingAccount.id;
	}

	// Create a default cash account
	const [newAccount] = await db
		.insert(moneyAccounts)
		.values({
			userId,
			name: "Kas",
			type: "cash",
			currency: "IDR",
		})
		.returning({ id: moneyAccounts.id });

	if (!newAccount) {
		throw new Error("Failed to create default account");
	}

	return newAccount.id;
}

/**
 * Find category ID by name for a user
 * @param userId - The user ID
 * @param categoryName - The category name to find
 * @param type - The category type (income/expense)
 * @returns Category ID or null
 */
async function findCategoryId(
	userId: string,
	categoryName: string,
	type: "income" | "expense",
): Promise<string | null> {
	const category = await db.query.moneyCategories.findFirst({
		where: and(
			eq(moneyCategories.userId, userId),
			eq(moneyCategories.name, categoryName),
			eq(moneyCategories.type, type),
		),
		columns: { id: true },
	});
	return category?.id ?? null;
}

/** Parsed transaction from AI */
interface ParsedTransaction {
	name: string;
	amount: number;
	currency: string;
	type: "income" | "expense";
	category: string;
}

/** Stored transaction result for response formatting */
interface StoredTransaction extends ParsedTransaction {
	success: boolean;
	error?: string;
}

/**
 * Format currency amount in Indonesian style
 * @param amount - The amount to format
 * @param currency - The currency code (default: IDR)
 * @returns Formatted currency string
 */
function formatCurrency(amount: number, currency = "IDR"): string {
	if (currency === "IDR") {
		return `Rp ${amount.toLocaleString("id-ID")}`;
	}
	return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Format success response message for WhatsApp
 * @param transactions - Array of stored transactions
 * @returns Formatted WhatsApp message
 */
function formatSuccessMessage(transactions: StoredTransaction[]): string {
	const successful = transactions.filter((tx) => tx.success);
	const failed = transactions.filter((tx) => !tx.success);

	let message = "✅ *Transaksi Tercatat*\n\n";

	for (const tx of successful) {
		const emoji = tx.type === "income" ? "💰" : "💸";
		const typeLabel = tx.type === "income" ? "Pemasukan" : "Pengeluaran";
		message += `${emoji} *${tx.name}*\n`;
		message += `   ${typeLabel}: ${formatCurrency(tx.amount, tx.currency)}\n`;
		message += `   Kategori: ${tx.category}\n\n`;
	}

	if (failed.length > 0) {
		message += "⚠️ *Gagal dicatat:*\n";
		for (const tx of failed) {
			message += `   ❌ ${tx.name}: ${tx.error || "Unknown error"}\n`;
		}
	}

	return message.trim();
}

/**
 * Format failure response message for WhatsApp
 * @param error - The error message
 * @returns Formatted WhatsApp error message
 */
function formatFailureMessage(error: string): string {
	return `❌ *Gagal memproses transaksi*\n\n${error}`;
}

/**
 * Handler for transaction-related messages from specific WhatsApp group
 * Reacts with 👍 emoji and uses AI to parse transaction details
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
		let cleanedText = text.trim();
		if (cleanedText.startsWith("```")) {
			// Remove opening ```json or ``` and closing ```
			cleanedText = cleanedText
				.replace(/^```(?:json)?\n?/, "")
				.replace(/\n?```$/, "")
				.trim();
		}

		let parsed: ParsedTransaction[];
		try {
			parsed = JSON.parse(cleanedText);
		} catch (_parseError) {
			appLogger.error(
				new Error(
					`[Transaction] Failed to parse AI response as JSON: ${text}`,
				),
			);
			return;
		}

		// Skip if no transactions parsed
		if (!Array.isArray(parsed) || parsed.length === 0) {
			appLogger.info(
				"[Transaction] No transactions found in message, skipping",
			);
			return;
		}

		appLogger.info(
			`[Transaction] Parsed ${parsed.length} transaction(s): ${JSON.stringify(parsed, null, 2)}`,
		);

		// Get or create default account
		const accountId = await getOrCreateDefaultAccount(userId);

		// Convert Unix timestamp (seconds) to Date for the transaction date
		const transactionDate = new Date(context.timestamp * 1000);

		// Store transactions in database and track results
		const storedTransactions: StoredTransaction[] = [];

		for (const tx of parsed) {
			try {
				// Find category ID
				const categoryId = await findCategoryId(
					userId,
					tx.category,
					tx.type,
				);

				if (!categoryId) {
					appLogger.info(
						`[Transaction] Category "${tx.category}" not found for type "${tx.type}", storing without category`,
					);
				}

				// Insert transaction with account balance update
				await db.transaction(async (dbTx) => {
					// Insert the transaction
					await dbTx.insert(moneyTransactions).values({
						userId,
						accountId,
						categoryId,
						type: tx.type,
						amount: String(tx.amount),
						description: tx.name,
						date: transactionDate,
						source: "import",
						waMessageId: context.messageId,
					});

					// Update account balance
					const balanceChange =
						tx.type === "income" ? tx.amount : -tx.amount;
					await dbTx
						.update(moneyAccounts)
						.set({
							balance: sql`${moneyAccounts.balance} + ${balanceChange}`,
							updatedAt: new Date(),
						})
						.where(eq(moneyAccounts.id, accountId));
				});

				storedTransactions.push({ ...tx, success: true });
				appLogger.info(
					`[Transaction] Stored transaction: ${tx.name} (${tx.type}) - ${tx.amount} ${tx.currency}`,
				);
			} catch (txError) {
				const errorMessage =
					txError instanceof Error
						? txError.message
						: "Unknown error";
				storedTransactions.push({
					...tx,
					success: false,
					error: errorMessage,
				});
				appLogger.error(
					new Error(
						`[Transaction] Failed to store transaction "${tx.name}": ${errorMessage}`,
					),
				);
			}
		}

		const successCount = storedTransactions.filter(
			(tx) => tx.success,
		).length;

		// Send response based on results
		if (successCount > 0) {
			// React with 👍 for successful transactions
			const reactionResult = await whatsappService.sendReaction({
				messageId: context.messageId,
				reaction: "👍",
				session: context.session,
			});

			if (reactionResult.success) {
				appLogger.info(
					`[Transaction] Successfully reacted to message ${context.messageId}`,
				);
			}

			// Send formatted success message as reply
			const successMessage = formatSuccessMessage(storedTransactions);
			const replyResult = await whatsappService.sendText({
				chatId: context.chatId,
				text: successMessage,
				session: context.session,
				reply_to: context.messageId,
			});

			if (replyResult.success) {
				appLogger.info(
					`[Transaction] Sent success reply - stored ${successCount}/${parsed.length} transactions`,
				);
			} else {
				appLogger.error(
					new Error(
						`[Transaction] Failed to send success reply: ${replyResult.message}`,
					),
				);
			}
		} else if (storedTransactions.length > 0) {
			// All transactions failed - send failure message
			const failureMessage = formatFailureMessage(
				"Semua transaksi gagal disimpan. Silakan coba lagi.",
			);
			await whatsappService.sendText({
				chatId: context.chatId,
				text: failureMessage,
				session: context.session,
				reply_to: context.messageId,
			});
		}
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		appLogger.error(
			new Error(
				`[Transaction] Error processing message: ${errorMessage}`,
			),
		);

		// Send error message to chat
		try {
			await whatsappService.sendText({
				chatId: context.chatId,
				text: formatFailureMessage(errorMessage),
				session: context.session,
				reply_to: context.messageId,
			});
		} catch (_replyError) {
			appLogger.error(
				new Error("[Transaction] Failed to send error reply"),
			);
		}
	}
}
