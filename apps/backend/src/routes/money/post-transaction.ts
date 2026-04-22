import { transactionCreateSchema } from "@repo/validation";
import { and, eq, sql } from "drizzle-orm";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { badRequest, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

async function getOrCreateDefaultAccount(userId: string): Promise<string> {
	const existingAccount = await db.query.moneyAccounts.findFirst({
		where: and(
			eq(moneyAccounts.userId, userId),
			eq(moneyAccounts.isActive, true),
		),
		columns: { id: true },
	});

	if (existingAccount) return existingAccount.id;

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
		throw badRequest({ message: "Failed to create default account" });
	}

	return newAccount.id;
}

/**
 * POST /money/transactions - Create a new transaction
 */
const postTransactionRoute = createHonoRoute()
	.use(authInfo)
	.post("/", requestValidator("json", transactionCreateSchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();
		const data = c.req.valid("json");
		if (data.type === "reconcile") {
			throw badRequest({
				message:
					"Manual reconcile transaction is not allowed. Use account reconcile endpoint.",
				formErrors: {
					type: "Use /money/accounts/:id/reconcile for reconciliation",
				},
			});
		}
		const effectiveAccountId =
			data.accountId || (await getOrCreateDefaultAccount(uid));

		// Validate account belongs to user
		const account = await db.query.moneyAccounts.findFirst({
			where: and(
				eq(moneyAccounts.id, effectiveAccountId),
				eq(moneyAccounts.userId, uid),
			),
		});
		if (!account) {
			throw badRequest({
				message: "Account not found",
				formErrors: { accountId: "Account not found" },
			});
		}

		// Validate toAccount for transfer
		if (data.type === "transfer") {
			if (!data.accountId || !data.toAccountId) {
				throw badRequest({
					message:
						"Transfer requires source and destination account",
					formErrors: {
						accountId: "Source account is required",
						toAccountId: "Destination account is required",
					},
				});
			}

			const toAccount = await db.query.moneyAccounts.findFirst({
				where: and(
					eq(moneyAccounts.id, data.toAccountId),
					eq(moneyAccounts.userId, uid),
				),
			});

			if (!toAccount) {
				throw badRequest({
					message: "Destination account not found",
					formErrors: {
						toAccountId: "Destination account not found",
					},
				});
			}
		}

		// Validate category if provided
		if (data.categoryId) {
			const category = await db.query.moneyCategories.findFirst({
				where: and(
					eq(moneyCategories.id, data.categoryId),
					eq(moneyCategories.userId, uid),
				),
			});

			if (!category) {
				throw badRequest({
					message: "Category not found",
					formErrors: { categoryId: "Category not found" },
				});
			}

			// Category type must match transaction type (for income/expense)
			if (data.type !== "transfer" && category?.type !== data.type) {
				throw badRequest({
					message: "Category type must match transaction type",
					formErrors: {
						categoryId: `Category must be of type '${data.type}'`,
					},
				});
			}
		}

		// Use a database transaction to ensure atomicity
		const result = await db.transaction(async (tx) => {
			// Create transaction record
			const [newTransaction] = await tx
				.insert(moneyTransactions)
				.values({
					userId: uid,
					accountId: effectiveAccountId,
					categoryId: data.categoryId,
					type: data.type,
					amount: String(data.amount),
					description: data.description,
					date: data.date,
					toAccountId: data.toAccountId,
					source: "manual",
					tags: data.tags,
					labels: data.labels,
					attachmentUrl: data.attachmentUrl,
				})
				.returning();

			// Update account balances based on transaction type
			if (data.type === "income") {
				// Add to account balance
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} + ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, effectiveAccountId));
			} else if (data.type === "expense") {
				// Subtract from account balance
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} - ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, effectiveAccountId));
			} else if (data.type === "transfer" && data.toAccountId) {
				// Subtract from source account
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} - ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, effectiveAccountId));

				// Add to destination account
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} + ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, data.toAccountId));
			}

			return newTransaction;
		});

		if (!result) {
			return c.json({ error: "Failed to create transaction" }, 500);
		}

		// Get full transaction with relations
		const transaction = await db.query.moneyTransactions.findFirst({
			where: eq(moneyTransactions.id, result.id),
			with: {
				account: {
					columns: {
						id: true,
						name: true,
						type: true,
						icon: true,
						color: true,
					},
				},
				category: {
					columns: {
						id: true,
						name: true,
						type: true,
						icon: true,
						color: true,
					},
				},
				toAccount: {
					columns: {
						id: true,
						name: true,
						type: true,
						icon: true,
						color: true,
					},
				},
			},
		});

		return c.json({ data: transaction }, 201);
	});

export default postTransactionRoute;
