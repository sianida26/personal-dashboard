import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { and, eq, sql } from "drizzle-orm";
import appEnv from "../../appEnv";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { users } from "../../drizzle/schema/users";
import {
	getOrCreateDeterministicDefaultAccount,
	NEEDS_ACCOUNT_REVIEW_LABEL,
} from "../money/default-account";
import appLogger from "../../utils/logger";
import type { WhatsAppMessageContext } from "../whatsapp/types";
import whatsappService from "../whatsapp/whatsapp-service";
import {
	buildRevisionPrompt,
	buildTransactionPrompt,
} from "./transaction-prompt";

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
 * Find category ID by name for a user
 * @param userId - The user ID
 * @param categoryName - The category name to find
 * @param type - The category type (income/expense)
 * @returns Category ID or null
 */
async function findCategoryId(
	userId: string,
	categoryName: string,
	type: "income" | "expense" | "transfer",
): Promise<string | null> {
	if (type === "transfer") return null;

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
	accountName?: string;
}

/** Stored transaction result for response formatting */
interface StoredTransaction extends ParsedTransaction {
	success: boolean;
	accountName?: string;
	error?: string;
}

interface ActiveAccount {
	id: string;
	name: string;
}

function normalizeAccountName(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function detectTrailingAccountLine(
	body: string,
	accounts: ActiveAccount[],
): { account: ActiveAccount; bodyWithoutAccountLine: string } | null {
	const lines = body
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
	if (lines.length === 0 || accounts.length === 0) return null;

	const lastLine = lines.at(-1);
	if (!lastLine) return null;
	const normalizedLastLine = normalizeAccountName(lastLine);
	if (!normalizedLastLine) return null;

	const matchedAccount = accounts.find((account) => {
		const normalizedAccount = normalizeAccountName(account.name);
		return (
			normalizedLastLine === normalizedAccount ||
			(normalizedLastLine.length >= 4 &&
				(normalizedAccount.includes(normalizedLastLine) ||
					normalizedLastLine.includes(normalizedAccount)))
		);
	});

	if (!matchedAccount) return null;

	const linesWithoutAccount = lines.slice(0, -1);
	return {
		account: matchedAccount,
		bodyWithoutAccountLine: linesWithoutAccount.join("\n"),
	};
}

async function getActiveAccounts(userId: string): Promise<ActiveAccount[]> {
	const accounts = await db.query.moneyAccounts.findMany({
		where: and(
			eq(moneyAccounts.userId, userId),
			eq(moneyAccounts.isActive, true),
		),
		columns: {
			id: true,
			name: true,
		},
	});
	return accounts;
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
		message += `   Kategori: ${tx.category}\n`;
		if (tx.accountName) {
			message += `   Akun: ${tx.accountName}\n`;
		}
		message += "\n";
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
 * Also handles revisions when replying to bot's summary message
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

		// Step 1: Mark as read (centang biru)
		await whatsappService.sendSeen({
			chatId: context.chatId,
			session: context.session,
		});

		// Check if this is a reply to a bot message (revision flow)
		if (context.replyTo) {
			const isRevision = await handleRevision(context);
			if (isRevision) return;
		}

		// Check if this message has already been processed
		const existingTransaction = await db
			.select({ id: moneyTransactions.id })
			.from(moneyTransactions)
			.where(eq(moneyTransactions.waMessageId, context.messageId))
			.limit(1);

		if (existingTransaction.length > 0) {
			appLogger.info(
				`[Transaction] Message ${context.messageId} already processed, skipping`,
			);
			return;
		}

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

		const activeAccounts = await getActiveAccounts(userId);
		const accountNameById = new Map(
			activeAccounts.map((account) => [account.id, account.name]),
		);
		const detectedTrailingAccount = detectTrailingAccountLine(
			context.body,
			activeAccounts,
		);
		const messageForExtraction =
			detectedTrailingAccount?.bodyWithoutAccountLine || context.body;

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
			model: openai("gpt-5-mini"),
			prompt: await buildTransactionPrompt(messageForExtraction, userId),
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
		const defaultAccount =
			await getOrCreateDeterministicDefaultAccount(userId);
		const defaultAccountId = defaultAccount.id;

		// Use current server time for transaction date
		const transactionDate = new Date();

		// Store transactions in database and track results
		const storedTransactions: StoredTransaction[] = [];

		for (const tx of parsed) {
			try {
				const explicitAccount = tx.accountName
					? activeAccounts.find(
							(account) =>
								normalizeAccountName(account.name) ===
								normalizeAccountName(tx.accountName || ""),
						)
					: null;
				const usedFallbackDefault =
					!explicitAccount && !detectedTrailingAccount;
				const effectiveAccountId =
					explicitAccount?.id ||
					detectedTrailingAccount?.account.id ||
					defaultAccountId;
				const labels = usedFallbackDefault
					? [NEEDS_ACCOUNT_REVIEW_LABEL]
					: undefined;

				// Find category ID
				const categoryId = await findCategoryId(
					userId,
					tx.category,
					tx.type as "income" | "expense",
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
						accountId: effectiveAccountId,
						categoryId,
						type: tx.type,
						amount: String(tx.amount),
						description: tx.name,
						date: transactionDate,
						source: "import",
						waMessageId: context.messageId,
						labels,
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
						.where(eq(moneyAccounts.id, effectiveAccountId));
				});

				storedTransactions.push({ ...tx, success: true });
				const effectiveAccountName =
					accountNameById.get(effectiveAccountId) ||
					detectedTrailingAccount?.account.name ||
					(effectiveAccountId === defaultAccountId
						? defaultAccount.name
						: undefined);
				const lastStoredTransaction = storedTransactions.at(-1);
				if (lastStoredTransaction) {
					lastStoredTransaction.accountName = effectiveAccountName;
				}
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

				// Store bot reply message ID for revision tracking
				const replyData = replyResult.data as {
					id?: { _serialized?: string };
				};
				const botReplyId = replyData?.id?._serialized;
				if (botReplyId) {
					await db
						.update(moneyTransactions)
						.set({ waBotReplyId: botReplyId })
						.where(
							eq(
								moneyTransactions.waMessageId,
								context.messageId,
							),
						);
					appLogger.info(
						`[Transaction] Stored bot reply ID: ${botReplyId}`,
					);
				}
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

/**
 * Handle revision flow: user replies to bot's summary to correct transactions
 * @returns true if this was a revision (handled), false if not a revision
 */
async function handleRevision(
	context: WhatsAppMessageContext,
): Promise<boolean> {
	// Find transactions linked to the bot reply message being quoted
	const linkedTransactions = await db
		.select({
			id: moneyTransactions.id,
			description: moneyTransactions.description,
			amount: moneyTransactions.amount,
			type: moneyTransactions.type,
			categoryId: moneyTransactions.categoryId,
		})
		.from(moneyTransactions)
		.where(eq(moneyTransactions.waBotReplyId, context.replyTo!));

	if (linkedTransactions.length === 0) {
		// Not replying to a bot summary message — not a revision
		return false;
	}

	appLogger.info(
		`[Transaction] Revision request for ${linkedTransactions.length} transaction(s): ${context.body}`,
	);

	const userId = await getUserIdByUsername("superadmin");
	if (!userId) {
		appLogger.error(
			new Error("[Transaction] User 'superadmin' not found for revision"),
		);
		return true;
	}

	if (!appEnv.OPENAI_API_KEY) {
		return true;
	}

	// Resolve category names for the existing transactions
	const existingForPrompt = await Promise.all(
		linkedTransactions.map(async (tx) => {
			let categoryName = "Tanpa Kategori";
			if (tx.categoryId) {
				const cat = await db.query.moneyCategories.findFirst({
					where: eq(moneyCategories.id, tx.categoryId),
					columns: { name: true },
				});
				if (cat) categoryName = cat.name;
			}
			return {
				id: tx.id,
				name: tx.description || "Unknown",
				amount: Number(tx.amount),
				type: tx.type as "income" | "expense",
				category: categoryName,
			};
		}),
	);

	// AI revision
	const { text } = await generateText({
		model: openai("gpt-5-mini"),
		prompt: await buildRevisionPrompt(
			context.body,
			existingForPrompt,
			userId,
		),
		temperature: 0.1,
	});

	appLogger.info(`[Transaction] Revision AI Response: ${text}`);

	let cleanedText = text.trim();
	if (cleanedText.startsWith("```")) {
		cleanedText = cleanedText
			.replace(/^```(?:json)?\n?/, "")
			.replace(/\n?```$/, "")
			.trim();
	}

	interface RevisionItem {
		id: string;
		name?: string;
		amount?: number;
		currency?: string;
		type?: "income" | "expense";
		category?: string;
		delete?: boolean;
	}

	let revisions: RevisionItem[];
	try {
		revisions = JSON.parse(cleanedText);
	} catch {
		appLogger.error(
			new Error(
				`[Transaction] Failed to parse revision AI response: ${text}`,
			),
		);
		await whatsappService.sendText({
			chatId: context.chatId,
			text: formatFailureMessage("Gagal memproses revisi. Coba lagi ya."),
			session: context.session,
			reply_to: context.messageId,
		});
		return true;
	}

	if (!Array.isArray(revisions) || revisions.length === 0) {
		appLogger.info("[Transaction] No revisions parsed from AI response");
		return true;
	}

	// Apply revisions
	const results: string[] = [];
	for (const rev of revisions) {
		const existingTx = linkedTransactions.find((tx) => tx.id === rev.id);
		if (!existingTx) {
			appLogger.info(
				`[Transaction] Revision: transaction ${rev.id} not found, skipping`,
			);
			continue;
		}

		try {
			if (rev.delete) {
				// Delete transaction and reverse balance
				const fullTx = await db.query.moneyTransactions.findFirst({
					where: eq(moneyTransactions.id, rev.id),
				});
				if (fullTx) {
					const reverseChange =
						fullTx.type === "income"
							? -Number(fullTx.amount)
							: Number(fullTx.amount);
					await db.transaction(async (dbTx) => {
						await dbTx
							.delete(moneyTransactions)
							.where(eq(moneyTransactions.id, rev.id));
						await dbTx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${reverseChange}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, fullTx.accountId));
					});
					results.push(`🗑️ *${fullTx.description}* dihapus`);
				}
			} else {
				// Update transaction
				const updateData: Record<string, unknown> = {
					updatedAt: new Date(),
				};
				if (rev.name) updateData.description = rev.name;
				if (rev.type) updateData.type = rev.type;
				if (rev.category) {
					const transactionType = rev.type || existingTx.type;
					if (
						transactionType === "income" ||
						transactionType === "expense"
					) {
						const catId = await findCategoryId(
							userId,
							rev.category,
							transactionType as "income" | "expense",
						);
						if (catId) updateData.categoryId = catId;
					}
				}

				// Handle amount change with balance adjustment
				if (rev.amount && rev.amount !== Number(existingTx.amount)) {
					const oldAmount = Number(existingTx.amount);
					const newAmount = rev.amount;
					const txType = rev.type || existingTx.type;

					updateData.amount = String(newAmount);

					const fullTx = await db.query.moneyTransactions.findFirst({
						where: eq(moneyTransactions.id, rev.id),
					});
					if (fullTx) {
						// Reverse old, apply new
						const oldBalanceEffect =
							existingTx.type === "income"
								? oldAmount
								: -oldAmount;
						const newBalanceEffect =
							txType === "income" ? newAmount : -newAmount;
						const balanceDiff = newBalanceEffect - oldBalanceEffect;

						await db.transaction(async (dbTx) => {
							await dbTx
								.update(moneyTransactions)
								.set(updateData)
								.where(eq(moneyTransactions.id, rev.id));
							await dbTx
								.update(moneyAccounts)
								.set({
									balance: sql`${moneyAccounts.balance} + ${balanceDiff}`,
									updatedAt: new Date(),
								})
								.where(eq(moneyAccounts.id, fullTx.accountId));
						});
					}
				} else {
					await db
						.update(moneyTransactions)
						.set(updateData)
						.where(eq(moneyTransactions.id, rev.id));
				}

				const displayName =
					rev.name || existingTx.description || "Unknown";
				const displayAmount = rev.amount || Number(existingTx.amount);
				results.push(
					`✏️ *${displayName}*: ${formatCurrency(displayAmount)}`,
				);
			}
		} catch (err) {
			const errMsg = err instanceof Error ? err.message : "Unknown error";
			appLogger.error(
				new Error(
					`[Transaction] Revision failed for ${rev.id}: ${errMsg}`,
				),
			);
			results.push(`❌ Gagal revisi: ${errMsg}`);
		}
	}

	// Send revision confirmation
	if (results.length > 0) {
		await whatsappService.sendReaction({
			messageId: context.messageId,
			reaction: "👍",
			session: context.session,
		});

		const message = `✅ *Revisi Berhasil*\n\n${results.join("\n")}`;
		await whatsappService.sendText({
			chatId: context.chatId,
			text: message,
			session: context.session,
			reply_to: context.messageId,
		});
	}

	return true;
}
