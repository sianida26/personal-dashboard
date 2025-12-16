import type { ClientResponse } from "hono/client";
import FormResponseError from "@/errors/FormResponseError";
import ResponseError from "@/errors/ResponseError";

// biome-ignore lint/suspicious/noExplicitAny: any is used to allow for any type of property
type BlankRecordToNever<T> = T extends any
	? T extends null
		? null
		: keyof T extends never
			? never
			: T
	: never;

type ParsedResponse = {
	data: unknown;
	rawText: string;
	parseError?: Error;
};

const parseResponseBody = async (res: Response): Promise<ParsedResponse> => {
	const rawText = await res.text();
	const contentType = res.headers.get("content-type") ?? "";
	const isLikelyJson = contentType.includes("application/json");

	if (!rawText) {
		return { data: null, rawText };
	}

	if (isLikelyJson) {
		try {
			return { data: JSON.parse(rawText), rawText };
		} catch (error) {
			return {
				data: null,
				rawText,
				parseError:
					error instanceof Error
						? error
						: new Error("Failed to parse JSON response"),
			};
		}
	}

	return { data: null, rawText };
};

const pickErrorBody = (
	data: unknown,
):
	| {
			message?: string;
			formErrors?: Record<string, string>;
			errorCode?: string;
	  }
	| undefined => {
	if (data && typeof data === "object" && !Array.isArray(data)) {
		return data as {
			message?: string;
			formErrors?: Record<string, string>;
			errorCode?: string;
		};
	}
	return undefined;
};

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
	endpoint: Promise<ClientResponse<T>>,
): Promise<BlankRecordToNever<T>> {
	const res = await endpoint;
	const { data, rawText, parseError } = await parseResponseBody(res);

	if (res.ok) {
		if (parseError) {
			throw new ResponseError(
				"Received an invalid JSON response from the server",
				res.status,
			);
		}

		if (data === null) {
			return null as BlankRecordToNever<T>;
		}

		if (data === undefined && !rawText) {
			return null as BlankRecordToNever<T>;
		}

		if (data === null && rawText) {
			throw new ResponseError(
				"Unexpected non-JSON response from the server",
				res.status,
			);
		}

		return data as BlankRecordToNever<T>;
	}

	//TODO: Add error reporting

	const errorBody = pickErrorBody(data);

	const isRateLimited = res.status === 429;
	const defaultMessage = isRateLimited
		? "Too many requests. Please wait before trying again."
		: res.statusText || "Something is gone wrong";

	const errorMessage =
		errorBody?.message ??
		(rawText?.trim() ? rawText : undefined) ??
		(parseError ? "Invalid error response format" : undefined) ??
		defaultMessage;

	if (res.status === 422 && errorBody?.formErrors) {
		throw new FormResponseError(
			errorMessage ?? "Validation error",
			errorBody.formErrors,
		);
	}

	throw new ResponseError(
		errorMessage ?? "Something is gone wrong",
		res.status,
		errorBody?.errorCode,
	);
}

export default fetchRPC;
