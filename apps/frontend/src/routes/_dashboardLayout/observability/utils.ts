import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

// Configure dayjs to use UTC
dayjs.extend(utc);

// Utility function for consistent UTC timestamp formatting
export const formatUTCTimestamp = (timestamp: string | Date) => {
	return dayjs(timestamp).utc().format("DD/MM/YYYY HH:mm:ss [UTC]");
};

export const formatUTCTime = (timestamp: string | Date) => {
	return dayjs(timestamp).utc().format("HH:mm:ss [UTC]");
};

// Utility functions for consistent color coding
export const getStatusCodeVariant = (statusCode: number) => {
	if (statusCode >= 200 && statusCode < 300) return "success"; // Green (success)
	if (statusCode >= 300 && statusCode < 400) return "redirect"; // Gray (redirect)
	if (statusCode >= 400 && statusCode < 500) return "clientError"; // Orange (client error)
	if (statusCode >= 500) return "serverError"; // Red (server error)
	return "outline";
};

export const getResponseTimeColor = (responseTime: number) => {
	if (responseTime < 300) return "text-green-600"; // Green (fast)
	if (responseTime <= 1000) return "text-orange-500"; // Orange (moderate)
	return "text-red-600"; // Red (slow)
};

export const getMethodVariant = (method: string) => {
	switch (method) {
		case "GET":
			return "methodGet"; // Blue
		case "POST":
			return "methodPost"; // Green
		case "PUT":
			return "methodPut"; // Orange
		case "DELETE":
			return "methodDelete"; // Red
		case "PATCH":
			return "methodPatch"; // Purple
		default:
			return "outline";
	}
};

export const getSuccessRateVariant = (successRate: number) => {
	if (successRate >= 90) return "success"; // Green
	if (successRate >= 75) return "clientError"; // Orange
	if (successRate >= 50) return "redirect"; // Gray
	return "serverError"; // Red
};

// Shared types
export interface ErrorEvent {
	id: string;
	eventType: string;
	timestamp: string;
	userId?: string;
	userName?: string;
	requestId?: string;
	endpoint: string;
	method?: string;
	statusCode?: number;
	responseTimeMs?: number;
	errorMessage?: string;
	stackTrace?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
}
