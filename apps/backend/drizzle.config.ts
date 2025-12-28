import type { Config } from "drizzle-kit";

// Use env var directly for drizzle-kit commands
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder";

export default {
	schema: "./src/drizzle/schema/*",
	out: "./src/drizzle/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
} satisfies Config;
