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
	APP_ENV: z.enum(["development", "production"]),
	APP_PORT: z.coerce.number().int(),
	BASE_URL: z.string(),
	DATABASE_URL: z.string(),
	ACCESS_TOKEN_SECRET: z.string(),
	REFRESH_TOKEN_SECRET: z.string(),
	COOKIE_SECRET: z.string(),

	//Logging
	LOG_ERROR: logSchema("true"),
	LOG_INFO: logSchema("true"),
	LOG_DEBUG: logSchema("false"),
	LOG_REQUEST: logSchema("true"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(parsedEnv.error.toString());
}

export default parsedEnv.data;
