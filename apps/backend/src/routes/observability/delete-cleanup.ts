import { lte, count } from "drizzle-orm";
import { createHonoRoute } from "../../utils/createHonoRoute";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import requestValidator from "../../utils/requestValidator";
import { cleanupQuerySchema } from "@repo/validation";
import db from "../../drizzle";
import { observabilityEvents } from "../../drizzle/schema/observability-events";
import { requestDetails } from "../../drizzle/schema/request-details";

/**
 * DELETE /observability/cleanup
 * Cleanup old observability data based on retention period
 */
const deleteCleanupEndpoint = createHonoRoute()
	.use(authInfo)
	.delete(
		"/observability/cleanup",
		checkPermission("observability.delete"),
		requestValidator("query", cleanupQuerySchema),
		async (c) => {
			const { retentionDays, dryRun } = c.req.valid("query");

			// Calculate cutoff date
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

			// Count records to be deleted
			const [eventsToDelete] = await db
				.select({ count: count() })
				.from(observabilityEvents)
				.where(lte(observabilityEvents.createdAt, cutoffDate));

			const [requestsToDelete] = await db
				.select({ count: count() })
				.from(requestDetails)
				.where(lte(requestDetails.createdAt, cutoffDate));

			const totalEventsToDelete = Number(eventsToDelete?.count) || 0;
			const totalRequestsToDelete = Number(requestsToDelete?.count) || 0;

			// If dry run, just return the counts
			if (dryRun) {
				return c.json({
					data: {
						dryRun: true,
						cutoffDate,
						retentionDays,
						eventsToDelete: totalEventsToDelete,
						requestsToDelete: totalRequestsToDelete,
						totalToDelete:
							totalEventsToDelete + totalRequestsToDelete,
					},
				});
			}

			// Perform actual cleanup
			let eventsDeleted = 0;
			let requestsDeleted = 0;

			try {
				// Count events to delete first
				const eventsToDeleteCount = await db
					.select({ count: count() })
					.from(observabilityEvents)
					.where(lte(observabilityEvents.createdAt, cutoffDate));

				const requestsToDeleteCount = await db
					.select({ count: count() })
					.from(requestDetails)
					.where(lte(requestDetails.createdAt, cutoffDate));

				eventsDeleted = Number(eventsToDeleteCount[0]?.count) || 0;
				requestsDeleted = Number(requestsToDeleteCount[0]?.count) || 0;

				// Perform the deletions
				await Promise.all([
					db
						.delete(observabilityEvents)
						.where(lte(observabilityEvents.createdAt, cutoffDate)),
					db
						.delete(requestDetails)
						.where(lte(requestDetails.createdAt, cutoffDate)),
				]);
			} catch (error) {
				throw new Error(
					`Cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}

			return c.json({
				data: {
					dryRun: false,
					cutoffDate,
					retentionDays,
					eventsDeleted,
					requestsDeleted,
					totalDeleted: eventsDeleted + requestsDeleted,
					message: "Cleanup completed successfully",
				},
			});
		},
	);

export default deleteCleanupEndpoint;
