import { and, asc, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { requestDetailsQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { requestDetails } from "../../drizzle/schema/request-details";
import { badRequest } from "../../errors/DashboardError";

/**
 * GET /observability/requests
 * List request details with filtering and pagination
 */
const getRequestsEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/observability/requests",
		checkPermission("observability.read"),
		requestValidator("query", requestDetailsQuerySchema),
		async (c) => {
			const {
				page,
				limit,
				userId,
				endpoint,
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
				whereConditions.push(ilike(requestDetails.endpoint, `%${endpoint}%`));
			}

			if (method) {
				whereConditions.push(eq(requestDetails.method, method));
			}

			if (startDate) {
				const startDateTime = new Date(startDate);
				if (Number.isNaN(startDateTime.getTime())) {
					throw badRequest({ message: "Invalid startDate format" });
				}
				whereConditions.push(gte(requestDetails.createdAt, startDateTime));
			}

			if (endDate) {
				const endDateTime = new Date(endDate);
				if (Number.isNaN(endDateTime.getTime())) {
					throw badRequest({ message: "Invalid endDate format" });
				}
				whereConditions.push(lte(requestDetails.createdAt, endDateTime));
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
						method: requestDetails.method,
						endpoint: requestDetails.endpoint,
						ipAddress: requestDetails.ipAddress,
						userAgent: requestDetails.userAgent,
						createdAt: requestDetails.createdAt,
					})
					.from(requestDetails)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
					.orderBy(orderBy)
					.limit(limit)
					.offset(offset),
				db
					.select({ count: requestDetails.id })
					.from(requestDetails)
					.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
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
