import { accountUpdateSchema } from "@repo/validation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import {
	badRequest,
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * PUT /money/accounts/:id - Update account
 */
const putAccountRoute = createHonoRoute()
	.use(authInfo)
	.put(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		requestValidator("json", accountUpdateSchema),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");
			if (data.balance !== undefined) {
				throw badRequest({
					message:
						"Manual account balance update is disabled. Use account reconciliation instead.",
					formErrors: {
						balance: "Use /money/accounts/:id/reconcile",
					},
				});
			}

			const existing = await db.query.moneyAccounts.findFirst({
				where: and(
					eq(moneyAccounts.id, id),
					eq(moneyAccounts.userId, uid),
				),
				columns: { id: true },
			});
			if (!existing) {
				throw notFound({ message: "Account not found" });
			}

			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};
			if (data.name !== undefined) updateData.name = data.name;
			if (data.type !== undefined) updateData.type = data.type;
			if (data.currency !== undefined)
				updateData.currency = data.currency.toUpperCase();
			if (data.icon !== undefined) updateData.icon = data.icon;
			if (data.color !== undefined) updateData.color = data.color;
			if (data.isActive !== undefined) updateData.isActive = data.isActive;

			const [updated] = await db
				.update(moneyAccounts)
				.set(updateData)
				.where(eq(moneyAccounts.id, id))
				.returning();

			return c.json({ data: updated });
		},
	);

export default putAccountRoute;
