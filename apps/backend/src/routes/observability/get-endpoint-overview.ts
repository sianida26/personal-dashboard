import { and, desc, eq, gte, lte } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { endpointOverviewQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";

/**
 * GET /endpoint-overview
 * Get aggregated statistics for each API endpoint grouped by route path
 */
const getEndpointOverviewEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/endpoint-overview",
		checkPermission("observability.read"),
		requestValidator("query", endpointOverviewQuerySchema),
		async (c) => {
			const { page, limit, startDate, endDate } = c.req.valid("query");

			// Build where conditions for date filtering
			const whereConditions = [
				eq(observabilityEvents.eventType, "api_request"),
			];

			if (startDate) {
				whereConditions.push(
					gte(observabilityEvents.timestamp, new Date(startDate)),
				);
			}

			if (endDate) {
				whereConditions.push(
					lte(observabilityEvents.timestamp, new Date(endDate)),
				);
			}

			// Get all endpoint data grouped by route path
			const rawData = await db
				.select({
					endpoint: observabilityEvents.endpoint,
					routePath: observabilityEvents.routePath,
					method: observabilityEvents.method,
					statusCode: observabilityEvents.statusCode,
					responseTimeMs: observabilityEvents.responseTimeMs,
					timestamp: observabilityEvents.timestamp,
				})
				.from(observabilityEvents)
				.where(and(...whereConditions))
				.orderBy(desc(observabilityEvents.timestamp));

			// Group by route path and method
			const groupedStats = new Map<
				string,
				{
					routePath: string;
					method: string;
					requests: typeof rawData;
				}
			>();

			for (const record of rawData) {
				// Use routePath if available, fallback to endpoint if routePath is null
				const routeKey = record.routePath || record.endpoint || "";
				const key = `${routeKey}|${record.method}`;

				if (!groupedStats.has(key)) {
					groupedStats.set(key, {
						routePath: routeKey,
						method: record.method || "GET",
						requests: [],
					});
				}

				const groupData = groupedStats.get(key);
				if (groupData) {
					groupData.requests.push(record);
				}
			}

			// Calculate statistics for each group
			const endpointStats = Array.from(groupedStats.values()).map(
				(group) => {
					const requests = group.requests;
					const totalRequests = requests.length;
					const responseTimes = requests
						.map((r) => r.responseTimeMs || 0)
						.filter((t) => t > 0);
					const successCount = requests.filter(
						(r) => (r.statusCode || 0) < 400,
					).length;
					const errorCount = requests.filter(
						(r) => (r.statusCode || 0) >= 400,
					).length;

					// Calculate percentiles
					const sortedTimes = responseTimes.sort((a, b) => a - b);
					const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
					const p95ResponseTime =
						sortedTimes.length > 0
							? sortedTimes[Math.max(0, p95Index)]
							: 0;

					const avgResponseTime =
						responseTimes.length > 0
							? responseTimes.reduce(
									(sum, time) => sum + time,
									0,
								) / responseTimes.length
							: 0;

					const lastRequest =
						requests.reduce((latest, current) => {
							const latestTime = latest.timestamp
								? new Date(latest.timestamp)
								: new Date(0);
							const currentTime = current.timestamp
								? new Date(current.timestamp)
								: new Date(0);
							return currentTime > latestTime ? current : latest;
						}).timestamp || new Date();

					return {
						endpoint: group.routePath,
						method: group.method,
						totalRequests,
						avgResponseTime:
							Math.round(avgResponseTime * 100) / 100,
						minResponseTime:
							responseTimes.length > 0
								? Math.min(...responseTimes)
								: 0,
						maxResponseTime:
							responseTimes.length > 0
								? Math.max(...responseTimes)
								: 0,
						p95ResponseTime:
							Math.round((p95ResponseTime || 0) * 100) / 100,
						successCount,
						errorCount,
						successRate:
							totalRequests > 0
								? Math.round(
										(successCount / totalRequests) *
											100 *
											100,
									) / 100
								: 0,
						errorRate:
							totalRequests > 0
								? Math.round(
										(errorCount / totalRequests) *
											100 *
											100,
									) / 100
								: 0,
						lastRequest,
					};
				},
			);

			// Sort by total requests descending and calculate pagination
			const sortedStats = endpointStats.sort((a, b) => b.totalRequests - a.totalRequests);
			
			// Calculate pagination
			const totalItems = sortedStats.length;
			const totalPages = Math.ceil(totalItems / limit);
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			const paginatedStats = sortedStats.slice(startIndex, endIndex);

			return c.json({
				data: paginatedStats,
				_metadata: {
					currentPage: page,
					perPage: limit,
					totalPages,
					totalItems,
				},
			});
		},
	);

export default getEndpointOverviewEndpoint;
