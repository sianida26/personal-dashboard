import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { analyticsQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { requestDetails } from "../../drizzle/schema/request-details";
import { users } from "../../drizzle/schema/users";
import { badRequest } from "../../errors/DashboardError";

/**
 * GET /analytics
 * Get analytics data with server-side histogram binning for response times
 */
const getAnalyticsEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/analytics",
		checkPermission("observability.read"),
		requestValidator("query", analyticsQuerySchema),
		async (c) => {
			const {
				endpoint,
				method,
				startDate,
				endDate,
				limit = 1000,
			} = c.req.valid("query");

			// Build where conditions
			const whereConditions = [];

			// Filter by routePath (endpoint) and method
			if (endpoint) {
				whereConditions.push(eq(requestDetails.routePath, endpoint));
			}

			if (method) {
				whereConditions.push(eq(requestDetails.method, method));
			}

			if (startDate) {
				const startDateTime = new Date(startDate);
				if (Number.isNaN(startDateTime.getTime())) {
					throw badRequest({ message: "Invalid startDate format" });
				}
				whereConditions.push(
					gte(requestDetails.createdAt, startDateTime),
				);
			}

			if (endDate) {
				const endDateTime = new Date(endDate);
				if (Number.isNaN(endDateTime.getTime())) {
					throw badRequest({ message: "Invalid endDate format" });
				}
				whereConditions.push(
					lte(requestDetails.createdAt, endDateTime),
				);
			}

			// Get raw analytics data - limited to the most recent records
			const rawData = await db
				.select({
					id: requestDetails.id,
					requestId: requestDetails.requestId,
					userId: requestDetails.userId,
					userName: users.name,
					method: requestDetails.method,
					endpoint: requestDetails.endpoint,
					fullEndpoint: sql<string>`
						CASE 
							WHEN ${requestDetails.queryParams} IS NOT NULL AND ${requestDetails.queryParams} != '{}' 
							THEN ${requestDetails.endpoint} || '?' || (
								SELECT string_agg(key || '=' || value, '&') 
								FROM jsonb_each_text(${requestDetails.queryParams})
							)
							ELSE ${requestDetails.endpoint}
						END
					`.as("fullEndpoint"),
					ipAddress: requestDetails.ipAddress,
					userAgent: requestDetails.userAgent,
					statusCode: observabilityEvents.statusCode,
					responseTimeMs: observabilityEvents.responseTimeMs,
					createdAt: requestDetails.createdAt,
				})
				.from(requestDetails)
				.leftJoin(users, eq(requestDetails.userId, users.id))
				.leftJoin(
					observabilityEvents,
					eq(requestDetails.requestId, observabilityEvents.requestId),
				)
				.where(
					whereConditions.length > 0
						? and(...whereConditions)
						: undefined,
				)
				.orderBy(desc(requestDetails.createdAt))
				.limit(limit);

			// Calculate statistics
			const totalRequests = rawData.length;
			const responseTimes = rawData
				.map((item) => item.responseTimeMs || 0)
				.filter((time) => time > 0);

			if (responseTimes.length === 0) {
				return c.json({
					data: rawData,
					statistics: {
						totalRequests: 0,
						avgResponseTime: 0,
						maxResponseTime: 0,
						medianResponseTime: 0,
						p95ResponseTime: 0,
						successRate: 0,
						statusCounts: {
							"2xx": 0,
							"3xx": 0,
							"4xx": 0,
							"5xx": 0,
						},
					},
					histogram: [],
				});
			}

			// Calculate basic statistics
			const avgResponseTime = Math.round(
				responseTimes.reduce((sum, time) => sum + time, 0) /
					responseTimes.length,
			);
			const maxResponseTime = Math.max(...responseTimes);

			// Calculate median and p95
			const sortedTimes = [...responseTimes].sort((a, b) => a - b);
			const medianResponseTime =
				sortedTimes.length % 2 === 0
					? Math.round(
							((sortedTimes[sortedTimes.length / 2 - 1] || 0) +
								(sortedTimes[sortedTimes.length / 2] || 0)) /
								2,
						)
					: sortedTimes[Math.floor(sortedTimes.length / 2)] || 0;

			const p95ResponseTime =
				sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;

			// Calculate status code distribution
			const statusCounts = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
			rawData.forEach((item) => {
				const statusCode = item.statusCode || 0;
				if (statusCode >= 200 && statusCode < 300)
					statusCounts["2xx"]++;
				else if (statusCode >= 300 && statusCode < 400)
					statusCounts["3xx"]++;
				else if (statusCode >= 400 && statusCode < 500)
					statusCounts["4xx"]++;
				else if (statusCode >= 500) statusCounts["5xx"]++;
			});

			const successRate =
				totalRequests > 0
					? Math.round((statusCounts["2xx"] / totalRequests) * 100)
					: 0;

			// Determine adaptive bin size based on max response time
			let binSize = 1; // Default 1ms bins
			if (maxResponseTime > 10000) {
				binSize = 10; // 10ms bins for very high response times (>10s)
			} else if (maxResponseTime > 1000) {
				binSize = 5; // 5ms bins for high response times (>1s)
			}

			// Create histogram bins with adaptive sizing
			const histogramMap = new Map<
				number,
				{ "2xx": number; "3xx": number; "4xx": number; "5xx": number }
			>();

			// Initialize histogram bins
			const maxBin = Math.ceil(maxResponseTime / binSize) * binSize;
			for (let i = 0; i <= maxBin; i += binSize) {
				histogramMap.set(i, { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 });
			}

			// Fill histogram data
			rawData.forEach((item) => {
				const responseTime = item.responseTimeMs || 0;
				const statusCode = item.statusCode || 0;

				// Determine which bin this response time belongs to
				const binIndex = Math.floor(responseTime / binSize) * binSize;

				// Get status category
				let statusCategory: "2xx" | "3xx" | "4xx" | "5xx" = "2xx";
				if (statusCode >= 300 && statusCode < 400)
					statusCategory = "3xx";
				else if (statusCode >= 400 && statusCode < 500)
					statusCategory = "4xx";
				else if (statusCode >= 500) statusCategory = "5xx";

				// Increment the appropriate bin
				const bin = histogramMap.get(binIndex);
				if (bin) {
					bin[statusCategory]++;
				}
			});

			// Convert histogram map to array
			const histogram = Array.from(histogramMap.entries())
				.map(([binStart, counts]) => ({
					range: `${binStart}${binSize > 1 ? `-${binStart + binSize - 1}` : ""}ms`,
					binStart,
					binSize,
					order: binStart / binSize + 1,
					...counts,
				}))
				.sort((a, b) => a.order - b.order);

			return c.json({
				data: rawData,
				statistics: {
					totalRequests,
					avgResponseTime,
					maxResponseTime,
					medianResponseTime,
					p95ResponseTime,
					successRate,
					statusCounts,
				},
				histogram,
				_metadata: {
					binSize,
					totalBins: histogram.length,
					granularity: `${binSize}ms`,
				},
			});
		},
	);

export default getAnalyticsEndpoint;
