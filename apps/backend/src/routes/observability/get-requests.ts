import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { requestDetailsQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { requestDetails } from "../../drizzle/schema/request-details";
import { users } from "../../drizzle/schema/users";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { badRequest } from "../../errors/DashboardError";

/**
 * GET /requests
 * List request details with filtering and pagination
 */
const getRequestsEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/requests",
		checkPermission("observability.read"),
		requestValidator("query", requestDetailsQuerySchema),
		async (c) => {
			const {
				page,
				limit,
				userId,
				endpoint,
				routePath,
				method,
				startDate,
				endDate,
				q,
				sort,
			} = c.req.valid("query");

			// Build where conditions
			const whereConditions = [];

			if (userId) {
				whereConditions.push(eq(requestDetails.userId, userId));
			}

			if (endpoint) {
				whereConditions.push(
					ilike(requestDetails.endpoint, `%${endpoint}%`),
				);
			}

			if (routePath) {
				whereConditions.push(eq(requestDetails.routePath, routePath));
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

			// Text search across endpoint and user agent
			if (q.trim()) {
				whereConditions.push(
					or(
						ilike(requestDetails.endpoint, `%${q}%`),
						ilike(requestDetails.userAgent, `%${q}%`),
					),
				);
			}

			// Parse sort parameter
			let orderBy = desc(requestDetails.createdAt); // Default sort
			if (sort) {
				const [field, direction] = sort.split(":");
				const isDesc = direction?.toLowerCase() === "desc";

				switch (field) {
					case "createdAt":
						orderBy = isDesc
							? desc(requestDetails.createdAt)
							: asc(requestDetails.createdAt);
						break;
					case "endpoint":
						orderBy = isDesc
							? desc(requestDetails.endpoint)
							: asc(requestDetails.endpoint);
						break;
					case "method":
						orderBy = isDesc
							? desc(requestDetails.method)
							: asc(requestDetails.method);
						break;
					default:
						orderBy = desc(requestDetails.createdAt);
				}
			}

			// Execute query with pagination
			const offset = (page - 1) * limit;

			const [requests, totalCount] = await Promise.all([
				db
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
						eq(
							requestDetails.requestId,
							observabilityEvents.requestId,
						),
					)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.orderBy(orderBy)
					.limit(limit)
					.offset(offset),
				db
					.select({ count: requestDetails.id })
					.from(requestDetails)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.then((result) => result.length),
			]);

			const totalPages = Math.ceil(totalCount / limit);

			return c.json({
				data: requests,
				_metadata: {
					totalItems: totalCount,
					totalPages,
					currentPage: page,
					perPage: limit,
				},
			});
		},
	);

export default getRequestsEndpoint;
