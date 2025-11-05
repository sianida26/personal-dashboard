import { isIP } from "node:net";
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
	APP_HOST: z
		.string()
		.default("127.0.0.1")
		.refine((val) => isIP(val) !== 0, {
			message: "Invalid IP address",
		}),
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
	LOG_INFO: logSchema("false"),
	LOG_DEBUG: logSchema("false"),
	LOG_REQUEST: logSchema("true"),
	LOG_SQL: logSchema("false"),

	OPENAI_API_KEY: z.string().optional(),

	// OpenTelemetry Configuration
	OTEL_ENABLED: logSchema("false"),
	OTEL_SERVICE_NAME: z.string().default("dashboard-backend"),
	OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default("http://localhost:4318"),
	OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

	// Notification Override Recipients
	// When set, these override all notification recipients (useful for testing/development)
	NOTIFICATION_OVERRIDE_EMAIL: z.string().email().optional(),
	NOTIFICATION_OVERRIDE_PHONE: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(parsedEnv.error.toString());
}

export default parsedEnv.data;
