import { StatusCode } from "hono/utils/http-status";

interface DashboardErrorParameter {
	errorCode: string;
	statusCode?: StatusCode;
	message: string;
	formErrors?: Record<string, string>;
	severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export default DashboardErrorParameter;
