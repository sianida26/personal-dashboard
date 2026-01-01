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

/**
 * POST /money/transactions - Create a new transaction
 */
const postTransactionRoute = createHonoRoute()
	.use(authInfo)
	.post("/", requestValidator("json", transactionCreateSchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();
		const data = c.req.valid("json");

		// Validate account belongs to user
		const account = await db.query.moneyAccounts.findFirst({
			where: and(
				eq(moneyAccounts.id, data.accountId),
				eq(moneyAccounts.userId, uid),
			),
		});

		if (!account) {
			badRequest({
				message: "Account not found",
				formErrors: { accountId: "Account not found" },
			});
		}

		// Validate toAccount for transfer
		if (data.type === "transfer" && data.toAccountId) {
			const toAccount = await db.query.moneyAccounts.findFirst({
				where: and(
					eq(moneyAccounts.id, data.toAccountId),
					eq(moneyAccounts.userId, uid),
				),
			});

			if (!toAccount) {
				badRequest({
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
				badRequest({
					message: "Category not found",
					formErrors: { categoryId: "Category not found" },
				});
			}

			// Category type must match transaction type (for income/expense)
			if (data.type !== "transfer" && category?.type !== data.type) {
				badRequest({
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
					accountId: data.accountId,
					categoryId: data.categoryId,
					type: data.type,
					amount: String(data.amount),
					description: data.description,
					date: data.date,
					toAccountId: data.toAccountId,
					source: "manual",
					tags: data.tags,
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
					.where(eq(moneyAccounts.id, data.accountId));
			} else if (data.type === "expense") {
				// Subtract from account balance
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} - ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, data.accountId));
			} else if (data.type === "transfer" && data.toAccountId) {
				// Subtract from source account
				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} - ${data.amount}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, data.accountId));

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
