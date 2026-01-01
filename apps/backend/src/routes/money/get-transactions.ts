import { transactionQuerySchema } from "@repo/validation";
import { and, asc, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import db from "../../drizzle";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/transactions - Get all transactions for the user with pagination
 */
const getTransactionsRoute = createHonoRoute()
	.use(authInfo)
	.get("/", requestValidator("query", transactionQuerySchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();
		const {
			page,
			limit,
			q,
			sort: sortParams,
			filter: filterParams,
			type,
			categoryId,
			accountId,
			startDate,
			endDate,
			minAmount,
			maxAmount,
		} = c.req.valid("query");

		// Build where conditions
		const whereConditions = [eq(moneyTransactions.userId, uid)];

		// Apply filters from query params
		if (type) {
			whereConditions.push(eq(moneyTransactions.type, type));
		}

		if (categoryId) {
			whereConditions.push(eq(moneyTransactions.categoryId, categoryId));
		}

		if (accountId) {
			whereConditions.push(eq(moneyTransactions.accountId, accountId));
		}

		if (startDate) {
			whereConditions.push(gte(moneyTransactions.date, startDate));
		}

		if (endDate) {
			whereConditions.push(lte(moneyTransactions.date, endDate));
		}

		if (minAmount !== undefined) {
			whereConditions.push(
				gte(moneyTransactions.amount, String(minAmount)),
			);
		}

		if (maxAmount !== undefined) {
			whereConditions.push(
				lte(moneyTransactions.amount, String(maxAmount)),
			);
		}

		// Search in description
		if (q) {
			whereConditions.push(
				ilike(moneyTransactions.description, `%${q}%`),
			);
		}

		// Apply filter params from ServerDataTable
		if (filterParams) {
			for (const filter of filterParams) {
				switch (filter.id) {
					case "type":
						if (
							filter.value === "income" ||
							filter.value === "expense" ||
							filter.value === "transfer"
						) {
							whereConditions.push(
								eq(moneyTransactions.type, filter.value),
							);
						}
						break;
					case "categoryId":
						whereConditions.push(
							eq(moneyTransactions.categoryId, filter.value),
						);
						break;
					case "accountId":
						whereConditions.push(
							eq(moneyTransactions.accountId, filter.value),
						);
						break;
				}
			}
		}

		// Build order by
		const orderByColumns = [];
		if (sortParams && sortParams.length > 0) {
			for (const sortParam of sortParams) {
				const column =
					sortParam.id === "date"
						? moneyTransactions.date
						: sortParam.id === "amount"
							? moneyTransactions.amount
							: sortParam.id === "createdAt"
								? moneyTransactions.createdAt
								: null;

				if (column) {
					orderByColumns.push(
						sortParam.desc ? desc(column) : asc(column),
					);
				}
			}
		}

		// Default sort by date descending
		if (orderByColumns.length === 0) {
			orderByColumns.push(desc(moneyTransactions.date));
			orderByColumns.push(desc(moneyTransactions.createdAt));
		}

		// Get total count
		const whereClause = and(...whereConditions);
		const totalCountResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(moneyTransactions)
			.where(whereClause);

		const total = Number(totalCountResult[0]?.count ?? 0);

		// Get transactions with relations
		const transactions = await db.query.moneyTransactions.findMany({
			where: whereClause,
			orderBy: orderByColumns,
			offset: (page - 1) * limit,
			limit,
			with: {
				account: {
					columns: {
						id: true,
						name: true,
						type: true,
						icon: true,
						color: true,
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
					},
				},
			},
		});

		return c.json({
			data: transactions,
			_metadata: {
				currentPage: page,
				totalPages: Math.ceil(total / limit),
				totalItems: total,
				perPage: limit,
			},
		});
	});

export default getTransactionsRoute;
