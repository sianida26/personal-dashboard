import type { ContentfulStatusCode } from "hono/utils/http-status";

interface DashboardErrorParameter {
	errorCode: string;
	statusCode?: ContentfulStatusCode;
	message: string;
	formErrors?: Record<string, string>;
	severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export default DashboardErrorParameter;
