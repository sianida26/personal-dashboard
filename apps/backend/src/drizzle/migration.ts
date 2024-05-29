import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import appEnv from "../appEnv";

configDotenv();

const dbUrl = appEnv.DATABASE_URL;

if (!dbUrl) throw new Error("DATABASE_URL is not set");

const migrationClient = postgres(dbUrl, { max: 1 });

migrate(drizzle(migrationClient), {
	migrationsFolder: "./src/drizzle/migrations",
}).then(() => {
	console.log("Migrations complete");
	process.exit(0);
});
