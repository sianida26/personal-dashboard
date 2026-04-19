import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
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
 * DELETE /money/accounts/:id - Soft delete account
 */
const deleteAccountRoute = createHonoRoute()
	.use(authInfo)
	.delete(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");

			const account = await db.query.moneyAccounts.findFirst({
				where: and(
					eq(moneyAccounts.id, id),
					eq(moneyAccounts.userId, uid),
				),
				columns: { id: true },
			});
			if (!account) throw notFound({ message: "Account not found" });

			const linkedTx = await db.query.moneyTransactions.findFirst({
				where: and(
					eq(moneyTransactions.userId, uid),
					eq(moneyTransactions.accountId, id),
				),
				columns: { id: true },
			});
			if (linkedTx) {
				throw badRequest({
					message:
						"Account has linked transactions. Keep it active or move transactions first.",
				});
			}

			await db
				.update(moneyAccounts)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(moneyAccounts.id, id));

			return c.json({ message: "Account deleted successfully" });
		},
	);

export default deleteAccountRoute;
