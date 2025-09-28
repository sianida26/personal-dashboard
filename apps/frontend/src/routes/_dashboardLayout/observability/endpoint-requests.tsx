import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const endpointRequestsSearchSchema = z.object({
	endpoint: z.string(),
	method: z.string(),
});

export const Route = createFileRoute("/_dashboardLayout/observability/endpoint-requests")({
	validateSearch: endpointRequestsSearchSchema,
});
