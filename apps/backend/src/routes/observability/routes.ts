import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";

// Import all observability endpoints
import getObservabilityEventsEndpoint from "./get-observability-events";
import getRequestByIdEndpoint from "./get-request-by-id";
import getRequestsEndpoint from "./get-requests";
import getMetricsEndpoint from "./get-metrics";
import getAnalyticsEndpoint from "./get-analytics";
import postFrontendEventEndpoint from "./post-frontend-event";
import deleteCleanupEndpoint from "./delete-cleanup";
import getEndpointOverviewEndpoint from "./get-endpoint-overview";
import getErrorEventsEndpoint from "./get-error-events";

/**
 * Observability routes
 * Handles monitoring, metrics, and event tracking endpoints
 */
const observabilityRoutes = new Hono<HonoEnv>()
	.route("/", getObservabilityEventsEndpoint) // GET /events
	.route("/", getRequestByIdEndpoint) // GET /requests/:id
	.route("/", getRequestsEndpoint) // GET /requests
	.route("/", getMetricsEndpoint) // GET /metrics
	.route("/", getAnalyticsEndpoint) // GET /analytics
	.route("/", postFrontendEventEndpoint) // POST /frontend
	.route("/", deleteCleanupEndpoint) // DELETE /cleanup
	.route("/", getEndpointOverviewEndpoint) // GET /endpoint-overview
	.route("/", getErrorEventsEndpoint); // GET /error-events

export default observabilityRoutes;
