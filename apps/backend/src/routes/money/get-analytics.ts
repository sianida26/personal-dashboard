import { moneyAnalyticsQuerySchema } from "@repo/validation";
import { and, count, eq, gte, lte, sql, sum } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/analytics - Get analytics data for the user
 * Returns summary, daily trends, and category breakdown
 */
const getAnalyticsRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/",
		requestValidator("query", moneyAnalyticsQuerySchema),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();

			const { startDate, endDate, accountId } = c.req.valid("query");

			// Default to last 30 days if no date range specified
			const now = new Date();
			const defaultEndDate = new Date(now);
			defaultEndDate.setHours(23, 59, 59, 999);
			const defaultStartDate = new Date(now);
			defaultStartDate.setDate(defaultStartDate.getDate() - 30);
			defaultStartDate.setHours(0, 0, 0, 0);

			const effectiveStartDate = startDate ?? defaultStartDate;
			const effectiveEndDate = endDate ?? defaultEndDate;

			// Build base where conditions
			const baseConditions = [
				eq(moneyTransactions.userId, uid),
				gte(moneyTransactions.date, effectiveStartDate),
				lte(moneyTransactions.date, effectiveEndDate),
			];

			if (accountId) {
				baseConditions.push(eq(moneyTransactions.accountId, accountId));
			}

			// 1. Get summary stats
			const summaryResult = await db
				.select({
					type: moneyTransactions.type,
					total: sum(moneyTransactions.amount),
					count: count(),
				})
				.from(moneyTransactions)
				.where(and(...baseConditions))
				.groupBy(moneyTransactions.type);

			let totalIncome = 0;
			let totalExpense = 0;
			let transactionCount = 0;

			for (const row of summaryResult) {
				const amount = Number(row.total) || 0;
				const rowCount = Number(row.count) || 0;
				transactionCount += rowCount;
				if (row.type === "income") {
					totalIncome = amount;
				} else if (row.type === "expense") {
					totalExpense = amount;
				}
			}

			// 2. Get daily trends
			const dailyTrendsResult = await db
				.select({
					date: moneyTransactions.date,
					type: moneyTransactions.type,
					total: sum(moneyTransactions.amount),
				})
				.from(moneyTransactions)
				.where(
					and(
						...baseConditions,
						sql`${moneyTransactions.type} IN ('income', 'expense')`,
					),
				)
				.groupBy(moneyTransactions.date, moneyTransactions.type)
				.orderBy(moneyTransactions.date);

			// Group daily trends by date
			const dailyTrendsMap = new Map<
				string,
				{ income: number; expense: number }
			>();
			for (const row of dailyTrendsResult) {
				const dateStr = row.date.toISOString().split("T")[0] ?? "";
				if (!dailyTrendsMap.has(dateStr)) {
					dailyTrendsMap.set(dateStr, { income: 0, expense: 0 });
				}
				const entry = dailyTrendsMap.get(dateStr)!;
				const amount = Number(row.total) || 0;
				if (row.type === "income") {
					entry.income = amount;
				} else if (row.type === "expense") {
					entry.expense = amount;
				}
			}

			const dailyTrends = Array.from(dailyTrendsMap.entries())
				.map(([date, { income, expense }]) => ({
					date,
					income,
					expense,
					net: income - expense,
				}))
				.sort((a, b) => a.date.localeCompare(b.date));

			// 3. Get category breakdown for expenses
			const expenseBreakdownResult = await db
				.select({
					categoryId: moneyTransactions.categoryId,
					categoryName: moneyCategories.name,
					categoryIcon: moneyCategories.icon,
					categoryColor: moneyCategories.color,
					total: sum(moneyTransactions.amount),
					count: count(),
				})
				.from(moneyTransactions)
				.leftJoin(
					moneyCategories,
					eq(moneyTransactions.categoryId, moneyCategories.id),
				)
				.where(
					and(
						...baseConditions,
						eq(moneyTransactions.type, "expense"),
					),
				)
				.groupBy(
					moneyTransactions.categoryId,
					moneyCategories.name,
					moneyCategories.icon,
					moneyCategories.color,
				)
				.orderBy(sql`${sum(moneyTransactions.amount)} DESC`);

			const expenseBreakdown = expenseBreakdownResult.map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName ?? "Tidak berkategori",
				categoryIcon: row.categoryIcon,
				categoryColor: row.categoryColor,
				total: Number(row.total) || 0,
				percentage:
					totalExpense > 0
						? Math.round(
								((Number(row.total) || 0) / totalExpense) *
									10000,
							) / 100
						: 0,
				count: Number(row.count) || 0,
			}));

			// 4. Get category breakdown for income
			const incomeBreakdownResult = await db
				.select({
					categoryId: moneyTransactions.categoryId,
					categoryName: moneyCategories.name,
					categoryIcon: moneyCategories.icon,
					categoryColor: moneyCategories.color,
					total: sum(moneyTransactions.amount),
					count: count(),
				})
				.from(moneyTransactions)
				.leftJoin(
					moneyCategories,
					eq(moneyTransactions.categoryId, moneyCategories.id),
				)
				.where(
					and(
						...baseConditions,
						eq(moneyTransactions.type, "income"),
					),
				)
				.groupBy(
					moneyTransactions.categoryId,
					moneyCategories.name,
					moneyCategories.icon,
					moneyCategories.color,
				)
				.orderBy(sql`${sum(moneyTransactions.amount)} DESC`);

			const incomeBreakdown = incomeBreakdownResult.map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName ?? "Tidak berkategori",
				categoryIcon: row.categoryIcon,
				categoryColor: row.categoryColor,
				total: Number(row.total) || 0,
				percentage:
					totalIncome > 0
						? Math.round(
								((Number(row.total) || 0) / totalIncome) *
									10000,
							) / 100
						: 0,
				count: Number(row.count) || 0,
			}));

			// 5. Get monthly trends (for longer time periods)
			const monthlyTrendsResult = await db
				.select({
					month: sql<string>`TO_CHAR(${moneyTransactions.date}, 'YYYY-MM')`,
					type: moneyTransactions.type,
					total: sum(moneyTransactions.amount),
				})
				.from(moneyTransactions)
				.where(
					and(
						...baseConditions,
						sql`${moneyTransactions.type} IN ('income', 'expense')`,
					),
				)
				.groupBy(
					sql`TO_CHAR(${moneyTransactions.date}, 'YYYY-MM')`,
					moneyTransactions.type,
				)
				.orderBy(sql`TO_CHAR(${moneyTransactions.date}, 'YYYY-MM')`);

			// Group monthly trends
			const monthlyTrendsMap = new Map<
				string,
				{ income: number; expense: number }
			>();
			for (const row of monthlyTrendsResult) {
				const monthStr = row.month;
				if (!monthlyTrendsMap.has(monthStr)) {
					monthlyTrendsMap.set(monthStr, { income: 0, expense: 0 });
				}
				const entry = monthlyTrendsMap.get(monthStr)!;
				const amount = Number(row.total) || 0;
				if (row.type === "income") {
					entry.income = amount;
				} else if (row.type === "expense") {
					entry.expense = amount;
				}
			}

			const monthlyTrends = Array.from(monthlyTrendsMap.entries())
				.map(([month, { income, expense }]) => ({
					month,
					income,
					expense,
					net: income - expense,
				}))
				.sort((a, b) => a.month.localeCompare(b.month));

			return c.json({
				summary: {
					totalIncome,
					totalExpense,
					netFlow: totalIncome - totalExpense,
					transactionCount,
				},
				dailyTrends,
				monthlyTrends,
				expenseBreakdown,
				incomeBreakdown,
				dateRange: {
					startDate: effectiveStartDate.toISOString(),
					endDate: effectiveEndDate.toISOString(),
				},
			});
		},
	);

export default getAnalyticsRoute;
