/**
 * Custom error class for handling API response errors with status codes and error codes.
 * Extends the built-in Error class to provide additional error handling capabilities.
 *
 * @extends Error
 */
class ResponseError extends Error {
	/** Error message describing what went wrong */
	public readonly message: string;

	/** HTTP status code associated with the error */
	public readonly statusCode: number;

	/** Optional custom error code for application-specific error handling */
	public readonly errorCode?: string;

	/**
	 * Creates a new ResponseError instance
	 *
	 * @param message - The error message describing what went wrong
	 * @param statusCode - HTTP status code (e.g., 400, 401, 403, 404, 500)
	 * @param errorCode - Optional custom error code for the application
	 *
	 * @example
	 * ```typescript
	 * throw new ResponseError(
	 *   "Unauthorized access",
	 *   401,
	 *   "INVALID_TOKEN"
	 * );
	 * ```
	 */
	constructor(message: string, statusCode: number, errorCode?: string) {
		super(message);

		this.message = message;
		this.statusCode = statusCode;
		this.errorCode = errorCode;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default ResponseError;
