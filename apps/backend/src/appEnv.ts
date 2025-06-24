import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Creates a Zod schema for logging options with a default value.
 *
 * This schema expects a string value of either "true" or "false" and transforms
 * it into a boolean. If no value is provided, the schema uses the specified default value.
 *
 * @param default Value - The default value to use if no value is provided.
 * It must be either "true" or "false".
 *
 * @returns A Zod schema that
 * validates and transforms
 * the input string into a boolean.
 */
const logSchema = (defaultValue: "true" | "false") =>
	z
		.enum(["true", "false"])
		.default(defaultValue)
		.transform((value) => value === "true");

const envSchema = z.object({
	//Application
	APP_ENV: z.enum(["development", "production"]),
	APP_HOST: z.string().ip().default("127.0.0.1"),
	APP_PORT: z.coerce.number().int(),
	BASE_URL: z.string(),
	FRONTEND_URL: z.string(),

	//Database
	DATABASE_URL: z.string(),

	//Secrets
	PRIVATE_KEY_PATH: z.string().default("private_key.pem"),
	PUBLIC_KEY_PATH: z.string().default("public_key.pem"),

	//Logging
	LOG_ERROR: logSchema("true"),
	LOG_INFO: logSchema("true"),
	LOG_DEBUG: logSchema("false"),
	LOG_REQUEST: logSchema("true"),
	LOG_SQL: logSchema("true"),

	//Observability Controls
	OBSERVABILITY_ENABLED: logSchema("true"),
	OBSERVABILITY_RECORD_SELF: logSchema("false"), // Record observability route calls
	OBSERVABILITY_RECORD_OPTIONS: logSchema("true"), // Record OPTIONS method requests (CORS preflight)
	OBSERVABILITY_RETENTION_DAYS: z.coerce.number().int().default(30),
	OBSERVABILITY_MAX_BODY_SIZE: z.coerce.number().int().default(10240), // Max request/response body size to store (bytes)

	//Data Privacy Controls
	OBSERVABILITY_MASK_SENSITIVE_DATA: logSchema("true"), // Mask passwords, tokens, etc.
	OBSERVABILITY_ANONYMIZE_USERS: logSchema("false"), // Store user IDs vs anonymous tracking
	OBSERVABILITY_STORE_REQUEST_BODIES: logSchema("true"), // Toggle request body storage
	OBSERVABILITY_STORE_RESPONSE_BODIES: logSchema("true"), // Toggle response body storage
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(parsedEnv.error.toString());
}

export default parsedEnv.data;
