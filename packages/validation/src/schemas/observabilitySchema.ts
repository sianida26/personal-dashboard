import { z } from "zod";

// Event types enum
export const eventTypeSchema = z.enum([
	"api_request",
	"frontend_error",
	"frontend_metric",
	"frontend_log", // New: for console.log, console.warn, etc
]);

// Frontend event submission schema
export const frontendEventSchema = z.object({
	eventType: eventTypeSchema,
	errorMessage: z.string().optional(),
	stackTrace: z.string().optional(),
	componentStack: z.string().optional(),
	route: z.string().optional(),
	logLevel: z.enum(["log", "info", "warn", "error", "debug"]).optional(), // For frontend_log events
	logMessage: z.string().optional(), // For frontend_log events
	logArgs: z.array(z.any()).optional(), // For frontend_log events
	metadata: z.record(z.any()).optional(),
});

// Query parameters for events filtering
export const observabilityEventsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(1000).default(20),
	eventType: eventTypeSchema.optional(),
	userId: z.string().optional(),
	endpoint: z.string().optional(),
	method: z.string().optional(),
	statusCode: z.coerce.number().int().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	q: z.string().default(""),
	sort: z.string().optional().default("createdAt:desc"),
});

// Request details query schema
export const requestDetailsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(1000).default(20),
	userId: z.string().optional(),
	endpoint: z.string().optional(),
	routePath: z.string().optional(),
	method: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	q: z.string().default(""),
	sort: z.string().optional().default("createdAt:desc"),
});

// Metrics query schema
export const metricsQuerySchema = z.object({
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	groupBy: z.enum(["hour", "day", "week"]).default("day"),
});

// Cleanup request schema
export const cleanupQuerySchema = z.object({
	retentionDays: z.coerce.number().int().min(1).max(365).default(30),
	dryRun: z
		.string()
		.optional()
		.transform((v) => v?.toLowerCase() === "true"),
});

// Endpoint overview query schema
export const endpointOverviewQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
});

export type FrontendEvent = z.infer<typeof frontendEventSchema>;
export type ObservabilityEventsQuery = z.infer<
	typeof observabilityEventsQuerySchema
>;
export type RequestDetailsQuery = z.infer<typeof requestDetailsQuerySchema>;
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
export type CleanupQuery = z.infer<typeof cleanupQuerySchema>;
export type EndpointOverviewQuery = z.infer<typeof endpointOverviewQuerySchema>;
