import type { Config } from "drizzle-kit";
import appEnv from "./src/appEnv";

const databaseUrl = appEnv.DATABASE_URL;

export default {
	schema: "./src/drizzle/schema/*",
	out: "./src/drizzle/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
} satisfies Config;
