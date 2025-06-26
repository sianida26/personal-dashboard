import { and, count, avg, gte, lte, sql, eq, desc } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { metricsQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { badRequest } from "../../errors/DashboardError";

/**
 * GET /observability/metrics
 * Get aggregated metrics for observability data
 */
const getMetricsEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/observability/metrics",
		checkPermission("observability.read"),
		requestValidator("query", metricsQuerySchema),
		async (c) => {
			const { startDate, endDate, groupBy } = c.req.valid("query");

			// Build date range conditions
			const whereConditions = [];

			if (startDate) {
				const startDateTime = new Date(startDate);
				if (Number.isNaN(startDateTime.getTime())) {
					throw badRequest({ message: "Invalid startDate format" });
				}
				whereConditions.push(
					gte(observabilityEvents.createdAt, startDateTime),
				);
			}

			if (endDate) {
				const endDateTime = new Date(endDate);
				if (Number.isNaN(endDateTime.getTime())) {
					throw badRequest({ message: "Invalid endDate format" });
				}
				whereConditions.push(
					lte(observabilityEvents.createdAt, endDateTime),
				);
			}

			// Only get API request events for performance metrics
			whereConditions.push(
				eq(observabilityEvents.eventType, "api_request"),
			);

			// Get overall metrics
			const [overallMetrics] = await db
				.select({
					totalRequests: count(),
					avgResponseTime: avg(observabilityEvents.responseTimeMs),
					successRate: sql<number>`
						CASE 
							WHEN COUNT(*) = 0 THEN 0 
							ELSE (COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 200 AND ${observabilityEvents.statusCode} < 300 THEN 1 END) * 100.0 / COUNT(*))
						END
					`,
					errorRate: sql<number>`
						CASE 
							WHEN COUNT(*) = 0 THEN 0 
							ELSE (COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 400 THEN 1 END) * 100.0 / COUNT(*))
						END
					`,
				})
				.from(observabilityEvents)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined,
				);

			// Get status code distribution
			const statusCodeStats = await db
				.select({
					statusCode: observabilityEvents.statusCode,
					count: count(),
				})
				.from(observabilityEvents)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined,
				)
				.groupBy(observabilityEvents.statusCode)
				.orderBy(desc(count()));

			// Get endpoint performance
			const endpointStats = await db
				.select({
					endpoint: observabilityEvents.endpoint,
					count: count(),
					avgResponseTime: avg(observabilityEvents.responseTimeMs),
					errorCount: sql<number>`
						COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 400 THEN 1 END)
					`,
				})
				.from(observabilityEvents)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined,
				)
				.groupBy(observabilityEvents.endpoint)
				.orderBy(desc(count()))
				.limit(10);

			// Get time-series data based on groupBy parameter
			type TimeSeriesItem = {
				period: string;
				count: number;
				avgResponseTime: string | null;
				errorCount: number;
			};

			let timeSeriesData: TimeSeriesItem[] = [];

			if (groupBy === "hour") {
				timeSeriesData = await db
					.select({
						period: sql<string>`date_trunc('hour', ${observabilityEvents.createdAt})`,
						count: count(),
						avgResponseTime: avg(
							observabilityEvents.responseTimeMs,
						),
						errorCount: sql<number>`
							COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 400 THEN 1 END)
						`,
					})
					.from(observabilityEvents)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.groupBy(
						sql`date_trunc('hour', ${observabilityEvents.createdAt})`,
					)
					.orderBy(
						sql`date_trunc('hour', ${observabilityEvents.createdAt})`,
					);
			} else if (groupBy === "day") {
				timeSeriesData = await db
					.select({
						period: sql<string>`date_trunc('day', ${observabilityEvents.createdAt})`,
						count: count(),
						avgResponseTime: avg(
							observabilityEvents.responseTimeMs,
						),
						errorCount: sql<number>`
							COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 400 THEN 1 END)
						`,
					})
					.from(observabilityEvents)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.groupBy(
						sql`date_trunc('day', ${observabilityEvents.createdAt})`,
					)
					.orderBy(
						sql`date_trunc('day', ${observabilityEvents.createdAt})`,
					);
			} else if (groupBy === "week") {
				timeSeriesData = await db
					.select({
						period: sql<string>`date_trunc('week', ${observabilityEvents.createdAt})`,
						count: count(),
						avgResponseTime: avg(
							observabilityEvents.responseTimeMs,
						),
						errorCount: sql<number>`
							COUNT(CASE WHEN ${observabilityEvents.statusCode} >= 400 THEN 1 END)
						`,
					})
					.from(observabilityEvents)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.groupBy(
						sql`date_trunc('week', ${observabilityEvents.createdAt})`,
					)
					.orderBy(
						sql`date_trunc('week', ${observabilityEvents.createdAt})`,
					);
			}

			// Get error distribution by event type
			const errorStats = await db
				.select({
					eventType: observabilityEvents.eventType,
					count: count(),
				})
				.from(observabilityEvents)
				.where(
					and(
						...(whereConditions.length > 0 ? whereConditions : []),
						sql`${observabilityEvents.errorMessage} IS NOT NULL`,
					),
				)
				.groupBy(observabilityEvents.eventType)
				.orderBy(desc(count()));

			return c.json({
				data: {
					overview: {
						totalRequests:
							Number(overallMetrics?.totalRequests) || 0,
						avgResponseTime: Math.round(
							Number(overallMetrics?.avgResponseTime) || 0,
						),
						successRate:
							Math.round(
								(Number(overallMetrics?.successRate) || 0) *
									100,
							) / 100,
						errorRate:
							Math.round(
								(Number(overallMetrics?.errorRate) || 0) * 100,
							) / 100,
					},
					statusCodeDistribution: statusCodeStats.map((stat) => ({
						statusCode: stat.statusCode,
						count: Number(stat.count),
					})),
					topEndpoints: endpointStats.map((stat) => ({
						endpoint: stat.endpoint,
						count: Number(stat.count),
						avgResponseTime: Math.round(
							Number(stat.avgResponseTime) || 0,
						),
						errorCount: Number(stat.errorCount),
						errorRate:
							stat.count > 0
								? Math.round(
										(Number(stat.errorCount) /
											Number(stat.count)) *
											10000,
									) / 100
								: 0,
					})),
					timeSeries: timeSeriesData.map((item) => ({
						period: item.period,
						count: Number(item.count),
						avgResponseTime: Math.round(
							Number(item.avgResponseTime) || 0,
						),
						errorCount: Number(item.errorCount),
						errorRate:
							item.count > 0
								? Math.round(
										(Number(item.errorCount) /
											Number(item.count)) *
											10000,
									) / 100
								: 0,
					})),
					errorsByType: errorStats.map((stat) => ({
						eventType: stat.eventType,
						count: Number(stat.count),
					})),
				},
			});
		},
	);

export default getMetricsEndpoint;
