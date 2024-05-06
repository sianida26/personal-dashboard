import { StatusCode } from "hono/utils/http-status";
import DashboardErrorParameter from "../types/DashboardErrorParameter";

class DashboardError extends Error {
	public readonly errorCode: string;
	public readonly statusCode: StatusCode = 500;
	public readonly message: string;
	public readonly formErrors?: Record<string, string>;
	public readonly severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" =
		"CRITICAL";

	constructor(options: DashboardErrorParameter) {
		super();

		this.errorCode = options.errorCode;
		this.statusCode = options.statusCode ?? this.statusCode;
		this.message = options.message;
		this.formErrors = options.formErrors;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export const notFound = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "NOT_FOUND",
		message: options?.message ?? "The requested data is not found",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 404,
	});
};

export const unauthorized = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "UNAUTHORIZED",
		message: options?.message ?? "Unauthorized",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 401,
	});
};

export default DashboardError;
