import { and, asc, eq, ne } from "drizzle-orm";
import db from "../../drizzle";
import { moneyAccounts } from "../../drizzle/schema/moneyAccounts";
import { badRequest } from "../../errors/DashboardError";

export const DEFAULT_ACCOUNT_NAME = "Kas";
export const NEEDS_ACCOUNT_REVIEW_LABEL = "needs_account_review";

interface DefaultAccountResult {
	id: string;
	name: string;
}

/**
 * Resolve a deterministic default account per user.
 * Priority:
 * 1) Active account explicitly marked as default.
 * 2) Oldest active account (and promote it as default).
 * 3) Create default "Kas" account.
 */
export async function getOrCreateDeterministicDefaultAccount(
	userId: string,
): Promise<DefaultAccountResult> {
	return db.transaction(async (tx) => {
		const [activeDefault] = await tx
			.select({
				id: moneyAccounts.id,
				name: moneyAccounts.name,
			})
			.from(moneyAccounts)
			.where(
				and(
					eq(moneyAccounts.userId, userId),
					eq(moneyAccounts.isActive, true),
					eq(moneyAccounts.isDefault, true),
				),
			)
			.orderBy(asc(moneyAccounts.createdAt), asc(moneyAccounts.id))
			.limit(1);

		if (activeDefault) {
			return activeDefault;
		}

		const [oldestActive] = await tx
			.select({
				id: moneyAccounts.id,
				name: moneyAccounts.name,
			})
			.from(moneyAccounts)
			.where(
				and(
					eq(moneyAccounts.userId, userId),
					eq(moneyAccounts.isActive, true),
				),
			)
			.orderBy(asc(moneyAccounts.createdAt), asc(moneyAccounts.id))
			.limit(1);

		if (oldestActive) {
			await tx
				.update(moneyAccounts)
				.set({
					isDefault: false,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(moneyAccounts.userId, userId),
						eq(moneyAccounts.isDefault, true),
						ne(moneyAccounts.id, oldestActive.id),
					),
				);

			await tx
				.update(moneyAccounts)
				.set({
					isDefault: true,
					updatedAt: new Date(),
				})
				.where(eq(moneyAccounts.id, oldestActive.id));

			return oldestActive;
		}

		const [created] = await tx
			.insert(moneyAccounts)
			.values({
				userId,
				name: DEFAULT_ACCOUNT_NAME,
				type: "cash",
				currency: "IDR",
				isDefault: true,
			})
			.returning({
				id: moneyAccounts.id,
				name: moneyAccounts.name,
			});

		if (!created) {
			throw badRequest({ message: "Failed to create default account" });
		}

		return created;
	});
}
