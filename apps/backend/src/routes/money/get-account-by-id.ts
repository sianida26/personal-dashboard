import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/accounts/:id - Get a single account by ID
 */
const getAccountByIdRoute = createHonoRoute()
	.use(authInfo)
	.get(
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
			});

			if (!account) {
				throw notFound({ message: "Account not found" });
			}

			return c.json({ data: account });
		},
	);

export default getAccountByIdRoute;
