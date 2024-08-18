import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
	APP_ENV: z.enum(["development", "production"]),
	APP_PORT: z.coerce.number().int(),
	DATABASE_URL: z.string(),
	ACCESS_TOKEN_SECRET: z.string(),
	REFRESH_TOKEN_SECRET: z.string(),
	COOKIE_SECRET: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(parsedEnv.error.toString());
}

export default parsedEnv.data;
