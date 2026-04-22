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

			if (existingTransaction?.type === "reconcile") {
				throw badRequest({
					message:
						"Reconcile transaction cannot be edited. Create a new reconciliation instead.",
				});
			}

			// Validate account if accountId is being updated
			if (data.accountId !== undefined) {
				const account = await db.query.moneyAccounts.findFirst({
					where: and(
						eq(moneyAccounts.id, data.accountId),
						eq(moneyAccounts.userId, uid),
					),
					columns: { id: true },
				});
				if (!account) {
					badRequest({
						message: "Account not found",
						formErrors: { accountId: "Account not found" },
					});
				}
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

			const oldAmount = Number(existingTransaction?.amount);
			const newAmount = data.amount ?? oldAmount;
			const oldAccountId = existingTransaction?.accountId;
			const newAccountId = data.accountId ?? oldAccountId;
			const accountChanged = Boolean(
				data.accountId && data.accountId !== oldAccountId,
			);

			// Use a database transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// Build update object
				const updateData: Record<string, unknown> = {
					updatedAt: new Date(),
				};

				if (data.amount !== undefined)
					updateData.amount = String(data.amount);
				if (data.accountId !== undefined)
					updateData.accountId = data.accountId;
				if (data.categoryId !== undefined)
					updateData.categoryId = data.categoryId;
				if (data.date !== undefined) updateData.date = data.date;
				if (data.description !== undefined)
					updateData.description = data.description;
				if (data.tags !== undefined) updateData.tags = data.tags;
				if (data.labels !== undefined) updateData.labels = data.labels;
				if (data.attachmentUrl !== undefined)
					updateData.attachmentUrl = data.attachmentUrl;

				// Update transaction
				await tx
					.update(moneyTransactions)
					.set(updateData)
					.where(eq(moneyTransactions.id, id));

				const shouldRecalculateBalance =
					newAmount !== oldAmount || accountChanged;

				if (shouldRecalculateBalance && oldAccountId && newAccountId) {
					if (existingTransaction?.type === "income") {
						// Reverse old effect on old account
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${oldAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, oldAccountId));

						// Apply new effect on new account
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${newAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, newAccountId));
					} else if (existingTransaction?.type === "expense") {
						// Reverse old effect on old account
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${oldAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, oldAccountId));

						// Apply new effect on new account
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${newAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, newAccountId));
					} else if (existingTransaction?.type === "transfer") {
						// Reverse old transfer effect
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${oldAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, oldAccountId));

						if (existingTransaction?.toAccountId) {
							await tx
								.update(moneyAccounts)
								.set({
									balance: sql`${moneyAccounts.balance} - ${oldAmount}`,
									updatedAt: new Date(),
								})
								.where(
									eq(
										moneyAccounts.id,
										existingTransaction.toAccountId,
									),
								);
						}

						// Apply new transfer effect
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${newAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, newAccountId));

						if (existingTransaction?.toAccountId) {
							await tx
								.update(moneyAccounts)
								.set({
									balance: sql`${moneyAccounts.balance} + ${newAmount}`,
									updatedAt: new Date(),
								})
								.where(
									eq(
										moneyAccounts.id,
										existingTransaction.toAccountId,
									),
								);
						}
					} else if (existingTransaction?.type === "reconcile") {
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${oldAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, oldAccountId));

						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} + ${newAmount}`,
								updatedAt: new Date(),
							})
							.where(eq(moneyAccounts.id, newAccountId));
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
