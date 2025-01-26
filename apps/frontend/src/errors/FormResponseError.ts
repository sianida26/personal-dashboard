import ResponseError from "./ResponseError";

/**
 * Represents an error that occurs during form validation or submission.
 * Extends the base ResponseError class to handle form-specific error cases.
 *
 * @extends ResponseError
 */
class FormResponseError extends ResponseError {
	/** Error message describing the form validation failure */
	public readonly message: string;

	/** Object containing field-specific validation errors */
	public readonly formErrors: Record<string, string>;

	/**
	 * Creates a new FormResponseError instance
	 *
	 * @param message - The error message describing the overall form error
	 * @param formErrors - Object mapping field names to their validation error messages
	 * @param statusCode - HTTP status code (defaults to 422 Unprocessable Entity)
	 * @param errorCode - Custom error code for the application (defaults to "INVALID_FORM_DATA")
	 *
	 * @example
	 * ```typescript
	 * throw new FormResponseError(
	 *   "Form validation failed",
	 *   {
	 *     email: "Invalid email format",
	 *     password: "Password must be at least 8 characters"
	 *   }
	 * );
	 * ```
	 */
	constructor(
		message: string,
		formErrors: Record<string, string>,
		statusCode = 422,
		errorCode = "INVALID_FORM_DATA"
	) {
		super(message, statusCode, errorCode);

		this.message = message;
		this.formErrors = formErrors;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default FormResponseError;
