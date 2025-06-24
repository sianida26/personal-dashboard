import appEnv from "../appEnv";

/**
 * Patterns to identify sensitive fields that should be masked
 */
const SENSITIVE_FIELD_PATTERNS = [
	/password/i,
	/token/i,
	/secret/i,
	/key/i,
	/auth/i,
	/credential/i,
	/bearer/i,
	/refresh/i,
	/access/i,
	/session/i,
];

/**
 * Sanitizes an object by masking sensitive fields based on predefined patterns
 * @param obj - The object to sanitize
 * @param patterns - Array of regex patterns to identify sensitive fields
 * @returns Sanitized object with sensitive fields masked
 */
export const sanitizeObject = (
	obj: unknown,
	patterns: RegExp[] = SENSITIVE_FIELD_PATTERNS,
): unknown => {
	if (!appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA) return obj;
	if (typeof obj !== "object" || obj === null) return obj;

	if (Array.isArray(obj)) {
		return obj.map((item) => sanitizeObject(item, patterns));
	}

	const sanitized = { ...obj } as Record<string, unknown>;

	for (const [key, value] of Object.entries(sanitized)) {
		if (patterns.some((pattern) => pattern.test(key))) {
			sanitized[key] = "[MASKED]";
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = sanitizeObject(value, patterns);
		}
	}

	return sanitized;
};

/**
 * Sanitizes request data including headers, body, and query parameters
 * @param data - Request data to sanitize
 * @returns Sanitized request data
 */
export const sanitizeRequestData = (data: unknown): unknown => {
	if (!appEnv.OBSERVABILITY_MASK_SENSITIVE_DATA) return data;
	return sanitizeObject(data, SENSITIVE_FIELD_PATTERNS);
};

/**
 * Determines if a request should be recorded based on configuration and path
 * @param path - The request path
 * @param method - The HTTP method
 * @returns Boolean indicating if the request should be recorded
 */
export const shouldRecordRequest = (path: string, method?: string): boolean => {
	if (!appEnv.OBSERVABILITY_ENABLED) return false;

	// Skip observability routes if OBSERVABILITY_RECORD_SELF is false
	if (
		path.startsWith("/observability") &&
		!appEnv.OBSERVABILITY_RECORD_SELF
	) {
		return false;
	}

	// Skip OPTIONS requests if OBSERVABILITY_RECORD_OPTIONS is false

	if (method === "OPTIONS" && !appEnv.OBSERVABILITY_RECORD_OPTIONS) {
		return false;
	}

	// Skip health check and test endpoints
	if (path === "/test" || path === "/health") {
		return false;
	}

	return true;
};

/**
 * Truncates large data to prevent storage issues
 * @param data - Data to potentially truncate
 * @param maxSize - Maximum size in bytes
 * @returns Truncated data or original if under limit
 */
export const truncateData = (
	data: unknown,
	maxSize: number = appEnv.OBSERVABILITY_MAX_BODY_SIZE,
): unknown => {
	if (!data) return data;

	const dataString = typeof data === "string" ? data : JSON.stringify(data);

	if (Buffer.byteLength(dataString, "utf8") > maxSize) {
		const truncated = dataString.substring(0, Math.floor(maxSize * 0.9));
		return `${truncated}... [TRUNCATED - Original size: ${Buffer.byteLength(dataString, "utf8")} bytes]`;
	}

	return data;
};

/**
 * Extracts selected headers from request/response headers
 * @param headers - Headers object
 * @param isRequest - Whether these are request headers (true) or response headers (false)
 * @returns Filtered headers object
 */
export const extractHeaders = (
	headers: Headers | Record<string, string>,
	isRequest: boolean = true,
): Record<string, string> => {
	const headersToCapture = isRequest
		? [
				"content-type",
				"content-length",
				"user-agent",
				"x-forwarded-for",
				"x-real-ip",
				"accept",
				"accept-encoding",
				"accept-language",
				"cache-control",
				"connection",
				"host",
				"referer",
				"origin",
				"authorization",
			]
		: [
				"content-type",
				"content-length",
				"cache-control",
				"set-cookie",
				"location",
				"x-response-time",
			];

	const result: Record<string, string> = {};

	if (headers instanceof Headers) {
		for (const key of headersToCapture) {
			const value = headers.get(key);
			if (value) {
				result[key] = value;
			}
		}
	} else if (typeof headers === "object" && headers !== null) {
		for (const key of headersToCapture) {
			// Check different case variations of the key in the headers object
			const value =
				headers[key] ||
				headers[key.toLowerCase()] ||
				headers[key.toUpperCase()] ||
				headers[key.charAt(0).toUpperCase() + key.slice(1)] || // title case
				Object.entries(headers).find(
					([headerKey]) =>
						headerKey.toLowerCase() === key.toLowerCase(),
				)?.[1];
			if (value) {
				result[key] = value;
			}
		}
	}

	return sanitizeObject(result, SENSITIVE_FIELD_PATTERNS) as Record<
		string,
		string
	>;
};

/**
 * Gets the client IP address from request headers
 * @param headers - Request headers
 * @returns Client IP address
 */
export const getClientIp = (headers: Headers): string | null => {
	// Check various headers for the real IP address
	const xForwardedFor = headers.get("x-forwarded-for");
	if (xForwardedFor) {
		// Take the first IP if there are multiple
		const firstIp = xForwardedFor.split(",")[0];
		return firstIp ? firstIp.trim() : null;
	}

	const xRealIp = headers.get("x-real-ip");
	if (xRealIp) {
		return xRealIp.trim();
	}

	const xClientIp = headers.get("x-client-ip");
	if (xClientIp) {
		return xClientIp.trim();
	}

	return null;
};
