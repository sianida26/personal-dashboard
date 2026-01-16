import { sql } from "drizzle-orm";
import db from "../../drizzle";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";

/**
 * GET /money/transactions/labels - Get all unique labels from user's transactions
 */
const getTransactionLabelsRoute = createHonoRoute()
	.use(authInfo)
	.get("/", async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		// Get all unique labels from the user's transactions
		const result = await db
			.select({
				labels: moneyTransactions.labels,
			})
			.from(moneyTransactions)
			.where(
				sql`${moneyTransactions.userId} = ${uid} AND ${moneyTransactions.labels} IS NOT NULL`,
			);

		// Flatten and deduplicate labels
		const labelsSet = new Set<string>();
		for (const row of result) {
			if (row.labels && Array.isArray(row.labels)) {
				for (const label of row.labels) {
					labelsSet.add(label);
				}
			}
		}

		// Sort labels alphabetically
		const uniqueLabels = Array.from(labelsSet).sort();

		return c.json({ data: uniqueLabels });
	});

export default getTransactionLabelsRoute;
