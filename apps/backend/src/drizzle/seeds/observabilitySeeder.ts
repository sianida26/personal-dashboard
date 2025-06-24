import { createId } from "@paralleldrive/cuid2";
import db from "../index";
import { observabilityEvents } from "../schema/observability-events";
import { requestDetails } from "../schema/request-details";

/**
 * Seed observability data for testing the observability dashboard
 */
export async function seedObservabilityData() {
	// Sample observability events
	const requestId1 = createId();
	const requestId2 = createId();
	const requestId3 = createId();

	const sampleEvents = [
		// API Request events
		{
			id: createId(),
			eventType: "api_request" as const,
			timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
			userId: null,
			requestId: requestId1,
			endpoint: "/dashboard/getSidebarItems",
			method: "GET",
			statusCode: 200,
			responseTimeMs: 45,
			errorMessage: null,
			stackTrace: null,
			metadata: { userAgent: "Mozilla/5.0 Test Browser" },
			createdAt: new Date(Date.now() - 86400000 * 2),
		},
		{
			id: createId(),
			eventType: "api_request" as const,
			timestamp: new Date(Date.now() - 86400000),
			userId: null,
			requestId: requestId2,
			endpoint: "/users",
			method: "GET",
			statusCode: 200,
			responseTimeMs: 120,
			errorMessage: null,
			stackTrace: null,
			metadata: { userAgent: "Mozilla/5.0 Test Browser" },
			createdAt: new Date(Date.now() - 86400000),
		},
		{
			id: createId(),
			eventType: "api_request" as const,
			timestamp: new Date(Date.now() - 43200000), // 12 hours ago
			userId: null,
			requestId: createId(),
			endpoint: "/roles",
			method: "POST",
			statusCode: 500,
			responseTimeMs: 250,
			errorMessage: "Internal server error",
			stackTrace: "Error: Database connection failed\n    at /app/routes/roles.ts:45:12",
			metadata: { userAgent: "Mozilla/5.0 Test Browser" },
			createdAt: new Date(Date.now() - 43200000),
		},
		// Frontend error events
		{
			id: createId(),
			eventType: "frontend_error" as const,
			timestamp: new Date(Date.now() - 21600000), // 6 hours ago
			userId: null,
			requestId: null,
			endpoint: "/dashboard",
			method: null,
			statusCode: null,
			responseTimeMs: null,
			errorMessage: "Cannot read property 'map' of undefined",
			stackTrace: "TypeError: Cannot read property 'map' of undefined\n    at Dashboard.tsx:45:23\n    at renderComponent",
			metadata: { 
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				route: "/dashboard",
				componentStack: "in Dashboard\n    in DashboardLayout"
			},
			createdAt: new Date(Date.now() - 21600000),
		},
		{
			id: createId(),
			eventType: "frontend_error" as const,
			timestamp: new Date(Date.now() - 7200000), // 2 hours ago
			userId: null,
			requestId: null,
			endpoint: "/users",
			method: null,
			statusCode: null,
			responseTimeMs: null,
			errorMessage: "Network request failed",
			stackTrace: "Error: Network request failed\n    at fetch.js:23:15\n    at useQuery hook",
			metadata: { 
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				route: "/users",
				error: "Failed to fetch user data"
			},
			createdAt: new Date(Date.now() - 7200000),
		},
		// Recent events
		{
			id: createId(),
			eventType: "api_request" as const,
			timestamp: new Date(Date.now() - 3600000), // 1 hour ago
			userId: null,
			requestId: requestId3,
			endpoint: "/observability/events",
			method: "GET",
			statusCode: 200,
			responseTimeMs: 75,
			errorMessage: null,
			stackTrace: null,
			metadata: { userAgent: "Mozilla/5.0 Test Browser" },
			createdAt: new Date(Date.now() - 3600000),
		},
		{
			id: createId(),
			eventType: "api_request" as const,
			timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
			userId: null,
			requestId: createId(),
			endpoint: "/app-settings",
			method: "GET",
			statusCode: 403,
			responseTimeMs: 25,
			errorMessage: "Forbidden",
			stackTrace: null,
			metadata: { userAgent: "Mozilla/5.0 Test Browser" },
			createdAt: new Date(Date.now() - 1800000),
		},
	];

	// Sample request details
	const sampleRequests = [
		{
			id: createId(),
			requestId: requestId1,
			userId: null,
			method: "GET",
			endpoint: "/dashboard/getSidebarItems",
			queryParams: {},
			requestBody: {},
			responseBody: { 
				data: [
					{ label: "Dashboard", link: "/dashboard", icon: "TbDashboard" }
				]
			},
			headers: {
				"user-agent": "Mozilla/5.0 Test Browser",
				"accept": "application/json",
			},
			ipAddress: "127.0.0.1",
			userAgent: "Mozilla/5.0 Test Browser",
			createdAt: new Date(Date.now() - 86400000 * 2),
		},
		{
			id: createId(),
			requestId: requestId2,
			userId: null,
			method: "GET",
			endpoint: "/users",
			queryParams: { page: "1", limit: "10" },
			requestBody: {},
			responseBody: { 
				data: [],
				_metadata: { total: 0, page: 1, perPage: 10 }
			},
			headers: {
				"user-agent": "Mozilla/5.0 Test Browser",
				"accept": "application/json",
			},
			ipAddress: "192.168.1.100",
			userAgent: "Mozilla/5.0 Test Browser",
			createdAt: new Date(Date.now() - 86400000),
		},
		{
			id: createId(),
			requestId: requestId3,
			userId: null,
			method: "GET",
			endpoint: "/observability/events",
			queryParams: { page: "1", limit: "10" },
			requestBody: {},
			responseBody: { 
				data: [],
				_metadata: { total: 0, page: 1, perPage: 10 }
			},
			headers: {
				"user-agent": "Mozilla/5.0 Test Browser",
				"accept": "application/json",
				"authorization": "Bearer [MASKED]",
			},
			ipAddress: "10.0.0.50",
			userAgent: "Mozilla/5.0 Test Browser",
			createdAt: new Date(Date.now() - 3600000),
		},
	];

	try {
		// Insert observability events
		await db.insert(observabilityEvents).values(sampleEvents);

		// Insert request details
		await db.insert(requestDetails).values(sampleRequests);

	} catch (error) {
		throw error;
	}
}

// Export for use in main seed runner
export default seedObservabilityData;
