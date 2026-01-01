import { transactionExportSchema } from "@repo/validation";
import { and, eq, gte, lte } from "drizzle-orm";
import db from "../../drizzle";
import { moneyTransactions } from "../../drizzle/schema/moneyTransactions";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * GET /money/transactions/export - Export transactions to CSV
 */
const getTransactionsExportRoute = createHonoRoute()
	.use(authInfo)
	.get(
		"/export",
		requestValidator("query", transactionExportSchema),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { format, type, categoryId, accountId, startDate, endDate } =
				c.req.valid("query");

			// Build where conditions
			const whereConditions = [eq(moneyTransactions.userId, uid)];

			if (type) {
				whereConditions.push(eq(moneyTransactions.type, type));
			}

			if (categoryId) {
				whereConditions.push(
					eq(moneyTransactions.categoryId, categoryId),
				);
			}

			if (accountId) {
				whereConditions.push(
					eq(moneyTransactions.accountId, accountId),
				);
			}

			if (startDate) {
				whereConditions.push(gte(moneyTransactions.date, startDate));
			}

			if (endDate) {
				whereConditions.push(lte(moneyTransactions.date, endDate));
			}

			// Get all transactions with relations
			const transactions = await db.query.moneyTransactions.findMany({
				where: and(...whereConditions),
				orderBy: (transactions, { desc }) => [desc(transactions.date)],
				with: {
					account: {
						columns: {
							name: true,
							type: true,
						},
					},
					category: {
						columns: {
							name: true,
						},
					},
					toAccount: {
						columns: {
							name: true,
						},
					},
				},
			});

			if (format === "csv") {
				// Generate CSV
				const headers = [
					"Date",
					"Type",
					"Amount",
					"Account",
					"Category",
					"Description",
					"To Account",
					"Tags",
					"Source",
				];

				const rows = transactions.map((t) => [
					t.date instanceof Date
						? t.date.toISOString().split("T")[0]
						: t.date,
					t.type,
					t.amount,
					t.account?.name ?? "",
					t.category?.name ?? "",
					(t.description ?? "").replace(/"/g, '""'), // Escape quotes
					t.toAccount?.name ?? "",
					(t.tags ?? []).join(";"),
					t.source,
				]);

				const csvContent = [
					headers.join(","),
					...rows.map((row) =>
						row
							.map((cell) =>
								typeof cell === "string" && cell.includes(",")
									? `"${cell}"`
									: cell,
							)
							.join(","),
					),
				].join("\n");

				const today = new Date().toISOString().split("T")[0];

				return new Response(csvContent, {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition": `attachment; filename="transactions-${today}.csv"`,
					},
				});
			}

			// For Excel format, return JSON that can be processed client-side
			// or implement xlsx generation if needed
			return c.json(
				{
					message: "Excel export not yet implemented, use CSV format",
				},
				501,
			);
		},
	);

export default getTransactionsExportRoute;
