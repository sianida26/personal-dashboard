import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * DELETE /money/transactions/:id - Delete a transaction
 * Reverses account balance changes and hard deletes the transaction
 */
const deleteTransactionRoute = createHonoRoute()
	.use(authInfo)
	.delete(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");

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

			const amount = Number(existingTransaction?.amount);

			// Use a database transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// Reverse account balance changes based on transaction type
				if (existingTransaction?.type === "income") {
					// Remove from account balance
					await tx
						.update(moneyAccounts)
						.set({
							balance: sql`${moneyAccounts.balance} - ${amount}`,
							updatedAt: new Date(),
						})
						.where(
							eq(
								moneyAccounts.id,
								existingTransaction?.accountId,
							),
						);
				} else if (existingTransaction?.type === "expense") {
					// Add back to account balance
					await tx
						.update(moneyAccounts)
						.set({
							balance: sql`${moneyAccounts.balance} + ${amount}`,
							updatedAt: new Date(),
						})
						.where(
							eq(
								moneyAccounts.id,
								existingTransaction?.accountId,
							),
						);
				} else if (existingTransaction?.type === "transfer") {
					// Add back to source account
					await tx
						.update(moneyAccounts)
						.set({
							balance: sql`${moneyAccounts.balance} + ${amount}`,
							updatedAt: new Date(),
						})
						.where(
							eq(
								moneyAccounts.id,
								existingTransaction?.accountId,
							),
						);

					// Remove from destination account
					if (existingTransaction?.toAccountId) {
						await tx
							.update(moneyAccounts)
							.set({
								balance: sql`${moneyAccounts.balance} - ${amount}`,
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

				// Delete transaction
				await tx
					.delete(moneyTransactions)
					.where(eq(moneyTransactions.id, id));
			});

			return c.json({ message: "Transaction deleted successfully" });
		},
	);

export default deleteTransactionRoute;
