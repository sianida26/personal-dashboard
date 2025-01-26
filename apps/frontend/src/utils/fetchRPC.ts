import FormResponseError from "@/errors/FormResponseError";
import ResponseError from "@/errors/ResponseError";
import { ClientResponse } from "hono/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlankRecordToNever<T> = T extends any
	? T extends null
		? null
		: keyof T extends never
			? never
			: T
	: never;

/**
 * Handles API requests and response parsing with type-safe error handling.
 * Automatically converts HTTP errors into typed ResponseError instances.
 *
 * @template T - The expected response data type
 * @param endpoint - The Hono endpoint to fetch data from
 * @returns Promise resolving to the typed response data
 * @throws {FormResponseError} For validation errors (status 422)
 * @throws {ResponseError} For other HTTP errors
 *
 * @example
 * ```typescript
 * import client from "@/honoClient";
 *
 * // Basic usage
 * const user = await fetchRPC(client.users.$get({
 * 	   query: { page: '1', limit: '10' }
 * }));
 *
 * // Error handling
 * try {
 *   const result = await fetchRPC(client.users.$get({
 * 	   query: { page: '1', limit: '10' }
 * 	 }));
 * } catch (error) {
 *   if (error instanceof FormResponseError) {
 *     // Handle validation errors
 *     console.log(error.formErrors);
 *   } else if (error instanceof ResponseError) {
 *     // Handle other API errors
 *     console.log(error.statusCode, error.message);
 *   }
 * }
 * ```
 */
async function fetchRPC<T>(
	endpoint: Promise<ClientResponse<T>>
): Promise<BlankRecordToNever<T>> {
	const res = await endpoint;

	// Handle successful responses (2xx status codes)
	if (res.ok) {
		const data = await res.json();
		return data as BlankRecordToNever<T>;
	}

	//TODO: Add error reporting

	// Extract error details from response body
	const data = (await res.json()) as unknown as {
		message?: string;
		formErrors?: Record<string, string>;
		errorCode?: string;
	};

	const errorMessage = data.message ?? "Something is gone wrong";

	// Handle form validation errors (422 Unprocessable Entity)
	if (res.status === 422 && data.formErrors) {
		throw new FormResponseError(errorMessage, data.formErrors);
	}

	// Handle all other error types
	throw new ResponseError(errorMessage, res.status, data.errorCode);
}

export default fetchRPC;
