import { accountReconcileSchema } from "@repo/validation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { badRequest, notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

const RECONCILIATION_CATEGORY_NAME = "Rekonsiliasi Saldo";

function formatIdr(value: number): string {
	const formatted = Math.abs(value).toLocaleString("id-ID");
	return `Rp ${formatted}`;
}

async function getOrCreateReconciliationCategory(
	userId: string,
	delta: number,
): Promise<string> {
	const type = delta >= 0 ? "income" : "expense";
	const existing = await db.query.moneyCategories.findFirst({
		where: and(
			eq(moneyCategories.userId, userId),
			eq(moneyCategories.name, RECONCILIATION_CATEGORY_NAME),
			eq(moneyCategories.type, type),
		),
		columns: { id: true },
	});

	if (existing) return existing.id;

	const [created] = await db
		.insert(moneyCategories)
		.values({
			userId,
			name: RECONCILIATION_CATEGORY_NAME,
			type,
		})
		.returning({ id: moneyCategories.id });

	if (!created) {
		throw badRequest({
			message: "Failed to create reconciliation category",
		});
	}

	return created.id;
}

/**
 * POST /money/accounts/:id/reconcile - Reconcile account balance
 */
const postAccountReconcileRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/:id/reconcile",
		requestValidator("param", z.object({ id: z.string() })),
		requestValidator("json", accountReconcileSchema),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();

			const { id } = c.req.valid("param");
			const { actualBalance } = c.req.valid("json");

			const account = await db.query.moneyAccounts.findFirst({
				where: and(
					eq(moneyAccounts.id, id),
					eq(moneyAccounts.userId, uid),
				),
			});

			if (!account) {
				throw notFound({ message: "Account not found" });
			}

			const systemBalance = Number(account.balance);
			const normalizedActualBalance = Number(actualBalance);
			const delta = normalizedActualBalance - systemBalance;

			if (delta === 0) {
				return c.json({
					data: {
						noOp: true,
						message: "Saldo sudah sinkron",
						accountId: account.id,
						accountBalance: systemBalance,
						systemBalance,
						actualBalance: normalizedActualBalance,
						delta,
						transaction: null,
					},
				});
			}

			const categoryId = await getOrCreateReconciliationCategory(uid, delta);
			const description = [
				`Rekonsiliasi saldo: sistem ${formatIdr(systemBalance)} -> aktual ${formatIdr(normalizedActualBalance)}`,
				`(selisih ${delta > 0 ? "+" : "-"}${formatIdr(Math.abs(delta))})`,
			].join(" ");

			const result = await db.transaction(async (tx) => {
				const [newTransaction] = await tx
					.insert(moneyTransactions)
					.values({
						userId: uid,
						accountId: account.id,
						categoryId,
						type: "reconcile",
						amount: String(delta),
						description,
						date: new Date(),
						source: "manual",
					})
					.returning();

				await tx
					.update(moneyAccounts)
					.set({
						balance: sql`${moneyAccounts.balance} + ${delta}`,
						updatedAt: new Date(),
					})
					.where(eq(moneyAccounts.id, account.id));

				return newTransaction;
			});

			const updatedAccount = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, account.id),
				columns: {
					id: true,
					balance: true,
				},
			});

			return c.json({
				data: {
					noOp: false,
					accountId: account.id,
					accountBalance: Number(updatedAccount?.balance ?? systemBalance),
					systemBalance,
					actualBalance: normalizedActualBalance,
					delta,
					transaction: result,
				},
			});
		},
	);

export default postAccountReconcileRoute;
