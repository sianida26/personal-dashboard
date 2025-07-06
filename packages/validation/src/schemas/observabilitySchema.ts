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

// Analytics query schema for server-side histogram binning
export const analyticsQuerySchema = z.object({
	endpoint: z.string().optional(),
	method: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	limit: z.coerce.number().int().min(1).max(1000).default(1000),
});

// Analytics response schema
export const analyticsResponseSchema = z.object({
	data: z.array(z.object({
		id: z.string(),
		requestId: z.string(),
		userId: z.string().nullable(),
		userName: z.string().nullable(),
		method: z.string(),
		endpoint: z.string(),
		fullEndpoint: z.string(),
		ipAddress: z.string().nullable(),
		userAgent: z.string().nullable(),
		statusCode: z.number().nullable(),
		responseTimeMs: z.number().nullable(),
		createdAt: z.string().nullable(),
	})),
	statistics: z.object({
		totalRequests: z.number(),
		avgResponseTime: z.number(),
		maxResponseTime: z.number(),
		medianResponseTime: z.number(),
		p95ResponseTime: z.number(),
		successRate: z.number(),
		statusCounts: z.object({
			"2xx": z.number(),
			"3xx": z.number(),
			"4xx": z.number(),
			"5xx": z.number(),
		}),
	}),
	histogram: z.array(z.object({
		range: z.string(),
		binStart: z.number(),
		binSize: z.number(),
		order: z.number(),
		"2xx": z.number(),
		"3xx": z.number(),
		"4xx": z.number(),
		"5xx": z.number(),
	})),
	_metadata: z.object({
		binType: z.enum(["linear", "logarithmic"]),
		totalBins: z.number(),
		maxValue: z.number(),
		granularity: z.string(),
	}),
});

export type FrontendEvent = z.infer<typeof frontendEventSchema>;
export type ObservabilityEventsQuery = z.infer<
	typeof observabilityEventsQuerySchema
>;
export type RequestDetailsQuery = z.infer<typeof requestDetailsQuerySchema>;
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
export type CleanupQuery = z.infer<typeof cleanupQuerySchema>;
export type EndpointOverviewQuery = z.infer<typeof endpointOverviewQuerySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
