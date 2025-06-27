import { eq } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import db from "../../drizzle";
import { requestDetails } from "../../drizzle/schema/request-details";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { notFound } from "../../errors/DashboardError";

/**
 * GET /requests/:id
 * Get detailed request information by request ID
 */
const getRequestByIdEndpoint = createHonoRoute()
	.use(authInfo)
	.get("/requests/:id", checkPermission("observability.read"), async (c) => {
		const requestId = c.req.param("id");

		// Get request details
		const requestDetail = await db.query.requestDetails.findFirst({
			where: eq(requestDetails.requestId, requestId),
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!requestDetail) {
			throw notFound({ message: "Request not found" });
		}

		// Get related observability events
		const relatedEvents = await db
			.select()
			.from(observabilityEvents)
			.where(eq(observabilityEvents.requestId, requestId))
			.orderBy(observabilityEvents.timestamp);

		return c.json({
			data: {
				...requestDetail,
				relatedEvents,
			},
		});
	});

export default getRequestByIdEndpoint;
