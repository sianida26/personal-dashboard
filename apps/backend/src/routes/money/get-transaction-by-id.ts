import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/transactions/:id - Get a single transaction by ID
 */
const getTransactionByIdRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");

			const transaction = await db.query.moneyTransactions.findFirst({
				where: and(
					eq(moneyTransactions.id, id),
					eq(moneyTransactions.userId, uid),
				),
				with: {
					account: {
						columns: {
							id: true,
							name: true,
							type: true,
							icon: true,
							color: true,
							currency: true,
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
							currency: true,
						},
					},
				},
			});

			if (!transaction) {
				notFound({ message: "Transaction not found" });
			}

			return c.json({ data: transaction });
		},
	);

export default getTransactionByIdRoute;
