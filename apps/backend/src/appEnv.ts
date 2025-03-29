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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(parsedEnv.error.toString());
}

export default parsedEnv.data;
