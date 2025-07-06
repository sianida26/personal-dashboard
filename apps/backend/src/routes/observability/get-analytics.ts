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

			// Helper function to get nice rounded max value
			const getNiceMax = (value: number): number => {
				if (value <= 100) {
					return Math.ceil(value / 10) * 10; // Round to nearest 10
				}
				if (value <= 1000) {
					return Math.ceil(value / 100) * 100; // Round to nearest 100
				}
				// For values > 1000, round to nearest power of 10 scale
				const magnitude = 10 ** Math.floor(Math.log10(value));
				const normalized = value / magnitude;
				let multiplier = 1;
				if (normalized <= 1.5) multiplier = 2;
				else if (normalized <= 3) multiplier = 5;
				else if (normalized <= 8.5)
					multiplier = 10; // Changed to 8.5
				else multiplier = 20;
				return (
					Math.ceil(normalized / multiplier) * multiplier * magnitude
				);
			};

			// Create histogram bins with improved adaptive sizing
			const histogramMap = new Map<
				number,
				{ "2xx": number; "3xx": number; "4xx": number; "5xx": number }
			>();

			const niceMax = getNiceMax(maxResponseTime);
			let bins: number[] = [];
			let binType: "linear" | "logarithmic" = "linear";

			if (niceMax <= 100) {
				// Linear with 1ms step
				for (let i = 0; i <= niceMax; i += 1) {
					bins.push(i);
				}
				binType = "linear";
			} else if (niceMax <= 1000) {
				// Linear with 10ms step
				for (let i = 0; i <= niceMax; i += 10) {
					bins.push(i);
				}
				binType = "linear";
			} else {
				// Logarithmic with 100 total ticks
				binType = "logarithmic";
				const logMax = Math.log10(niceMax);
				const logMin = Math.log10(1); // Start from 1ms
				const step = (logMax - logMin) / 99; // 99 steps for 100 bins

				const binSet = new Set<number>();
				for (let i = 0; i < 100; i++) {
					const logValue = logMin + i * step;
					const value = 10 ** logValue;
					binSet.add(Math.round(value));
				}

				// Convert set to sorted array and ensure we don't have too many duplicate low values
				bins = Array.from(binSet).sort((a, b) => a - b);

				// If we have too many bins at the low end, thin them out
				if (bins.length > 100) {
					const newBins = [1]; // Always start with 1
					let lastAdded = 1;
					for (let i = 1; i < bins.length; i++) {
						const current = bins[i] || 0;
						// Add if it's significantly different from the last added
						if (
							current >= lastAdded * 1.1 ||
							i >= bins.length - 20
						) {
							newBins.push(current);
							lastAdded = current;
						}
					}
					bins = newBins.slice(0, 100); // Ensure we don't exceed 100 bins
				}
			}

			// Initialize histogram bins
			for (const bin of bins) {
				histogramMap.set(bin, {
					"2xx": 0,
					"3xx": 0,
					"4xx": 0,
					"5xx": 0,
				});
			}

			// Fill histogram data
			rawData.forEach((item) => {
				const responseTime = item.responseTimeMs || 0;
				const statusCode = item.statusCode || 0;

				// Find the appropriate bin for this response time
				let binIndex = bins[0] || 0;
				for (let i = 0; i < bins.length - 1; i++) {
					const currentBin = bins[i];
					const nextBin = bins[i + 1];
					if (
						currentBin !== undefined &&
						nextBin !== undefined &&
						responseTime >= currentBin &&
						responseTime < nextBin
					) {
						binIndex = currentBin;
						break;
					}
				}
				// If response time is >= last bin, use the last bin
				const lastBin = bins[bins.length - 1];
				if (lastBin !== undefined && responseTime >= lastBin) {
					binIndex = lastBin;
				}

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
				.map(([binStart, counts], index) => {
					let range: string;
					if (binType === "linear") {
						const binSize = niceMax <= 100 ? 1 : 10;
						const binEnd = binStart + binSize - 1;
						range =
							binSize === 1
								? `${binStart}ms`
								: `${binStart}-${binEnd}ms`;
					} else {
						// Logarithmic bins
						const nextBin = bins[index + 1];
						if (nextBin) {
							range = `${binStart}-${nextBin - 1}ms`;
						} else {
							range = `${binStart}+ms`;
						}
					}

					return {
						range,
						binStart,
						binSize:
							binType === "linear"
								? niceMax <= 100
									? 1
									: 10
								: 0,
						order: index + 1,
						...counts,
					};
				})
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
					binType,
					totalBins: histogram.length,
					maxValue: niceMax,
					granularity:
						binType === "linear"
							? niceMax <= 100
								? "1ms"
								: "10ms"
							: "logarithmic",
				},
			});
		},
	);

export default getAnalyticsEndpoint;
