import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import requestValidator from "../../utils/requestValidator";
import { frontendEventSchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";

/**
 * POST /frontend
 * Submit frontend events (errors, metrics, etc.)
 */
const postFrontendEventEndpoint = createHonoRoute()
	.use(authInfo)
	.post(
		"/frontend",
		requestValidator("json", frontendEventSchema),
		async (c) => {
			const eventData = c.req.valid("json");
			const userId = c.var.uid;

			// Create observability event
			const [newEvent] = await db
				.insert(observabilityEvents)
				.values({
					eventType: eventData.eventType,
					userId: userId || null,
					endpoint: eventData.route || null,
					errorMessage: eventData.errorMessage || null,
					stackTrace: eventData.stackTrace || null,
					metadata: {
						...eventData.metadata,
						componentStack: eventData.componentStack,
					},
					timestamp: new Date(),
				})
				.returning();

			if (!newEvent) {
				throw new Error("Failed to create observability event");
			}

			return c.json(
				{
					data: {
						id: newEvent.id,
						message: "Frontend event recorded successfully",
					},
				},
				201,
			);
		},
	);

export default postFrontendEventEndpoint;
