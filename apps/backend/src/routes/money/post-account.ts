import { accountCreateSchema } from "@repo/validation";
import { and, eq } from "drizzle-orm";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * POST /money/accounts - Create a new account
 */
const postAccountRoute = createHonoRoute()
	.use(authInfo)
	.post("/", requestValidator("json", accountCreateSchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const data = c.req.valid("json");

		const [newAccount] = await db.transaction(async (tx) => {
			const existingActiveDefault =
				await tx.query.moneyAccounts.findFirst({
					where: and(
						eq(moneyAccounts.userId, uid),
						eq(moneyAccounts.isActive, true),
						eq(moneyAccounts.isDefault, true),
					),
					columns: { id: true },
				});

			const shouldSetDefault =
				data.isDefault === true || !existingActiveDefault;

			if (shouldSetDefault) {
				await tx
					.update(moneyAccounts)
					.set({
						isDefault: false,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(moneyAccounts.userId, uid),
							eq(moneyAccounts.isDefault, true),
						),
					);
			}

			return tx
				.insert(moneyAccounts)
				.values({
					userId: uid,
					name: data.name,
					type: data.type,
					balance: String(data.balance ?? 0),
					currency: (data.currency || "IDR").toUpperCase(),
					icon: data.icon,
					color: data.color,
					isDefault: shouldSetDefault,
				})
				.returning();
		});

		return c.json({ data: newAccount }, 201);
	});

export default postAccountRoute;
