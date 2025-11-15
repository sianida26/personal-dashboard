import { isLocalhost } from "./utils/isLocalhost";

// Check if test environment file exists to prevent accidental production runs
const testEnvLocalPath = `${process.cwd()}/.env.test.local`;
const testEnvPath = `${process.cwd()}/.env.test`;

const testEnvLocalExists = await Bun.file(testEnvLocalPath).exists();
const testEnvExists = await Bun.file(testEnvPath).exists();

if (!testEnvLocalExists && !testEnvExists) {
	console.error(
		"❌ ERROR: Neither .env.test.local nor .env.test file found.",
	);
	console.error(
		"   Test environment configuration is required to prevent accidental production database access.",
	);
	console.error(
		"   Please create .env.test.local or .env.test with TEST_DATABASE_URL.",
	);
	process.exit(1);
}

// Override DATABASE_URL for tests BEFORE any imports
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

// Check if database host is remote to prevent accidental production runs
try {
	const dbUrl = new URL(process.env.DATABASE_URL);
	const hostname = dbUrl.hostname;

	if (!isLocalhost(hostname)) {
		console.error(
			"❌ ERROR: Remote database host detected in DATABASE_URL.",
		);
		console.error(`   Host: ${hostname}`);
		console.error(
			"   Tests must only run against local databases to prevent accidental production data modification.",
		);
		console.error(
			"   Please use a local database in your .env.test.local or .env.test file.",
		);
		process.exit(1);
	}
} catch (error) {
	console.error("❌ ERROR: Invalid DATABASE_URL format.");
	console.error(error);
	process.exit(1);
}

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import seeder from "./drizzle/seed";

// Create a migration client
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// Run migrations
await migrate(drizzle(migrationClient), {
	migrationsFolder: "./src/drizzle/migrations",
});

// Close the migration client
await migrationClient.end();

// Run seeders
await seeder();
