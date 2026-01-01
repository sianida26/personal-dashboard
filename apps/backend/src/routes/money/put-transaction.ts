import { transactionUpdateSchema } from "@repo/validation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import {
	badRequest,
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * PUT /money/transactions/:id - Update a transaction
 */
const putTransactionRoute = createHonoRoute()
	.use(authInfo)
	.put(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		requestValidator("json", transactionUpdateSchema),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");

			// Check if transaction exists and belongs to user
			const existingTransaction =
				await db.query.moneyTransactions.findFirst({
					where: and(
						eq(moneyTransactions.id, id),
						eq(moneyTransactions.userId, uid),
					),
				});

			if (!existingTransaction) {
				notFound({ message: "Transaction not found" });
			}

			// Only allow updating manual transactions
			if (existingTransaction?.source !== "manual") {
				badRequest({
					message: "Only manual transactions can be updated",
				});
			}

			// Validate category if provided
			if (data.categoryId !== undefined && data.categoryId !== null) {
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
				if (
					existingTransaction?.type !== "transfer" &&
					category?.type !== existingTransaction?.type
				) {
					badRequest({
						message: "Category type must match transaction type",
						formErrors: {
							categoryId: `Category must be of type '${existingTransaction?.type}'`,
						},
					});
				}
			}

			// Calculate amount difference if amount is being updated
			const oldAmount = Number(existingTransaction?.amount);
			const newAmount = data.amount ?? oldAmount;
			const amountDiff = newAmount - oldAmount;

			// Use a database transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// Build update object
				const updateData: Record<string, unknown> = {
					updatedAt: new Date(),
				};

				if (data.amount !== undefined)
					updateData.amount = String(data.amount);
				if (data.categoryId !== undefined)
					updateData.categoryId = data.categoryId;
				if (data.date !== undefined) updateData.date = data.date;
				if (data.description !== undefined)
					updateData.description = data.description;
				if (data.tags !== undefined) updateData.tags = data.tags;
				if (data.attachmentUrl !== undefined)
					updateData.attachmentUrl = data.attachmentUrl;

				// Update transaction
				await tx
					.update(moneyTransactions)
					.set(updateData)
					.where(eq(moneyTransactions.id, id));

				// Update account balances if amount changed
				if (amountDiff !== 0) {
					if (existingTransaction?.type === "income") {
						// Adjust account balance
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${amountDiff}`,
								updatedAt: new Date(),
							})
							.where(
								eq(
									moneyAccounts.id,
									existingTransaction?.accountId,
								),
							);
					} else if (existingTransaction?.type === "expense") {
						// Adjust account balance (negative for expense)
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${amountDiff}`,
								updatedAt: new Date(),
							})
							.where(
								eq(
									moneyAccounts.id,
									existingTransaction?.accountId,
								),
							);
					} else if (existingTransaction?.type === "transfer") {
						// Adjust source account (decrease by diff)
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${amountDiff}`,
								updatedAt: new Date(),
							})
							.where(
								eq(
									moneyAccounts.id,
									existingTransaction?.accountId,
								),
							);

						// Adjust destination account (increase by diff)
						if (existingTransaction?.toAccountId) {
							await tx
								.update(moneyAccounts)
								.set({
									balance: sql`${moneyAccounts.balance} + ${amountDiff}`,
									updatedAt: new Date(),
								})
								.where(
									eq(
										moneyAccounts.id,
										existingTransaction?.toAccountId,
									),
								);
						}
					}
				}
			});

			// Get updated transaction with relations
			const updatedTransaction =
				await db.query.moneyTransactions.findFirst({
					where: eq(moneyTransactions.id, id),
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

			return c.json({ data: updatedTransaction });
		},
	);

export default putTransactionRoute;
