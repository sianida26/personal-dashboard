import { accountQuerySchema } from "@repo/validation";
import { and, eq } from "drizzle-orm";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/accounts - Get all accounts for the user
 */
const getAccountsRoute = createHonoRoute()
	.use(authInfo)
	.get("/", requestValidator("query", accountQuerySchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const { type, includeInactive } = c.req.valid("query");

		const whereConditions = [eq(moneyAccounts.userId, uid)];
		if (type) whereConditions.push(eq(moneyAccounts.type, type));
		if (!includeInactive) {
			whereConditions.push(eq(moneyAccounts.isActive, true));
		}

		const accounts = await db.query.moneyAccounts.findMany({
			where: and(...whereConditions),
			orderBy: (table, { desc }) => [
				desc(table.isDefault),
				desc(table.updatedAt),
			],
		});

		return c.json({ data: accounts });
	});

export default getAccountsRoute;
