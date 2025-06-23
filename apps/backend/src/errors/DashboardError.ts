import type { ContentfulStatusCode } from "hono/utils/http-status";
import type DashboardErrorParameter from "../types/DashboardErrorParameter";

/**
 * Custom error class for handling specific dashboard-related errors with detailed context.
 *
 * @extends Error
 */
class DashboardError extends Error {
	public readonly errorCode: string;
	public readonly statusCode: ContentfulStatusCode = 500;
	public readonly formErrors?: Record<string, string>;
	public readonly severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

	/**
	 * Creates an instance of DashboardError.
	 * @param options - Configuration object for the error.
	 */
	constructor(options: DashboardErrorParameter) {
		super(options.message);

		this.severity = options.severity ?? "CRITICAL";
		this.errorCode = options.errorCode;
		this.statusCode = options.statusCode ?? this.statusCode;
		this.formErrors = options.formErrors;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Throws a 'not found' error with customizable parameters.
 * @param options - Optional parameters to override default not found error properties.
 */
export const notFound = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "NOT_FOUND",
		message: options?.message ?? "The requested data is not found",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 404,
	});
};

/**
 * Throws an 'unauthorized' error with customizable parameters.
 * @param options - Optional parameters to override default unauthorized error properties.
 */
export const unauthorized = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "UNAUTHORIZED",
		message: options?.message ?? "Unauthorized",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 401,
	});
};

export const forbidden = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "FORBIDDEN",
		message: options?.message ?? "Forbidden",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 403,
	});
};

export const badRequest = (options?: Partial<DashboardErrorParameter>) => {
	throw new DashboardError({
		errorCode: options?.errorCode ?? "BAD_REQUEST",
		message: options?.message ?? "Bad Request",
		formErrors: options?.formErrors,
		severity: options?.severity ?? "LOW",
		statusCode: options?.statusCode ?? 400,
	});
};

export default DashboardError;
