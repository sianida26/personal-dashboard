import { and, asc, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { observabilityEventsQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { users } from "../../drizzle/schema/users";
import { badRequest } from "../../errors/DashboardError";

/**
 * GET /observability/events
 * List observability events with filtering and pagination
 */
const getObservabilityEventsEndpoint = createHonoRoute()
	.use(authInfo)
	.get(
		"/observability/events",
		checkPermission("observability.read"),
		requestValidator("query", observabilityEventsQuerySchema),
		async (c) => {
			const {
				page,
				limit,
				eventType,
				userId,
				endpoint,
				method,
				statusCode,
				startDate,
				endDate,
				q,
				sort,
			} = c.req.valid("query");

			// Build where conditions
			const whereConditions = [];

			if (eventType) {
				whereConditions.push(
					eq(observabilityEvents.eventType, eventType),
				);
			}

			if (userId) {
				whereConditions.push(eq(observabilityEvents.userId, userId));
			}

			if (endpoint) {
				whereConditions.push(
					ilike(observabilityEvents.endpoint, `%${endpoint}%`),
				);
			}

			if (method) {
				whereConditions.push(eq(observabilityEvents.method, method));
			}

			if (statusCode) {
				whereConditions.push(
					eq(observabilityEvents.statusCode, statusCode),
				);
			}

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

			// Text search across endpoint and error message
			if (q.trim()) {
				whereConditions.push(
					or(
						ilike(observabilityEvents.endpoint, `%${q}%`),
						ilike(observabilityEvents.errorMessage, `%${q}%`),
					),
				);
			}

			// Parse sort parameter
			let orderBy = desc(observabilityEvents.createdAt); // Default sort
			if (sort) {
				const [field, direction] = sort.split(":");
				const isDesc = direction?.toLowerCase() === "desc";

				switch (field) {
					case "createdAt":
						orderBy = isDesc
							? desc(observabilityEvents.createdAt)
							: asc(observabilityEvents.createdAt);
						break;
					case "timestamp":
						orderBy = isDesc
							? desc(observabilityEvents.timestamp)
							: asc(observabilityEvents.timestamp);
						break;
					case "responseTimeMs":
						orderBy = isDesc
							? desc(observabilityEvents.responseTimeMs)
							: asc(observabilityEvents.responseTimeMs);
						break;
					case "statusCode":
						orderBy = isDesc
							? desc(observabilityEvents.statusCode)
							: asc(observabilityEvents.statusCode);
						break;
					default:
						orderBy = desc(observabilityEvents.createdAt);
				}
			}

			// Execute query with pagination
			const offset = (page - 1) * limit;

			const [events, totalCount] = await Promise.all([
				db
					.select({
						id: observabilityEvents.id,
						eventType: observabilityEvents.eventType,
						timestamp: observabilityEvents.timestamp,
						userId: observabilityEvents.userId,
						userName: users.name,
						requestId: observabilityEvents.requestId,
						endpoint: observabilityEvents.endpoint,
						method: observabilityEvents.method,
						statusCode: observabilityEvents.statusCode,
						responseTimeMs: observabilityEvents.responseTimeMs,
						errorMessage: observabilityEvents.errorMessage,
						stackTrace: observabilityEvents.stackTrace,
						metadata: observabilityEvents.metadata,
						createdAt: observabilityEvents.createdAt,
					})
					.from(observabilityEvents)
					.leftJoin(users, eq(observabilityEvents.userId, users.id))
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.orderBy(orderBy)
					.limit(limit)
					.offset(offset),
				db
					.select({ count: observabilityEvents.id })
					.from(observabilityEvents)
					.where(
						whereConditions.length > 0
							? and(...whereConditions)
							: undefined,
					)
					.then((result) => result.length),
			]);

			const totalPages = Math.ceil(totalCount / limit);

			return c.json({
				data: events,
				_metadata: {
					totalItems: totalCount,
					totalPages,
					currentPage: page,
					perPage: limit,
				},
			});
		},
	);

export default getObservabilityEventsEndpoint;
