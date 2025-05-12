import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "./drizzle/seed";

// Load environment variables
configDotenv({ path: ".env.test.local" });

// Override DATABASE_URL for tests
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

// Create a migration client
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// Run migrations
await migrate(drizzle(migrationClient), {
	migrationsFolder: "./src/drizzle/migrations",
});

// Close the migration client
await migrationClient.end();

// Run seeders
console.time("Done seeding");

// The seed script is now imported and will run its IIFE.
// Remove individual seeder calls as they are handled by the imported seed script.

console.timeEnd("Done seeding");
