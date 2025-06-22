import { createId } from "@paralleldrive/cuid2";
import db from "../index";
import { projects } from "../schema/projects";
import { traces } from "../schema/traces";
import { metrics } from "../schema/metrics";
import { logs } from "../schema/logs";
import { errors } from "../schema/errors";
import { eq } from "drizzle-orm";

/**
 * Create sample observability data for testing
 */
async function createSampleData() {
	try {
		console.log("🧪 Creating sample observability data...");

		// Get the first project for testing
		const [project] = await db.select().from(projects).limit(1);
		if (!project) {
			console.log("❌ No projects found. Run the seeder first.");
			return;
		}

		console.log(`📊 Adding sample data to project: ${project.name}`);

		// Sample trace data
		const sampleTraces = [
			{
				id: createId(),
				projectId: project.id,
				traceId: "trace123456789abcdef",
				spanId: "span12345678",
				parentSpanId: null,
				operationName: "GET /api/users",
				startTime: new Date(Date.now() - 5000),
				endTime: new Date(Date.now() - 4500),
				durationMs: 500,
				statusCode: 1, // OK
				serviceName: "user-service",
				serviceVersion: "1.0.0",
				tags: {
					"http.method": "GET",
					"http.url": "/api/users",
					"http.status_code": 200,
					"user.id": "user123",
				},
				resourceAttributes: {
					"service.name": "user-service",
					"service.version": "1.0.0",
					"deployment.environment": "production",
				},
				isRoot: true,
			},
			{
				id: createId(),
				projectId: project.id,
				traceId: "trace123456789abcdef",
				spanId: "span87654321",
				parentSpanId: "span12345678",
				operationName: "SELECT users FROM database",
				startTime: new Date(Date.now() - 4800),
				endTime: new Date(Date.now() - 4600),
				durationMs: 200,
				statusCode: 1, // OK
				serviceName: "database",
				serviceVersion: "1.0.0",
				tags: {
					"db.system": "postgresql",
					"db.statement": "SELECT * FROM users LIMIT 10",
					"db.operation": "SELECT",
				},
				resourceAttributes: {
					"service.name": "database",
					"service.version": "1.0.0",
				},
				isRoot: false,
			},
		];

		// Sample metrics data
		const sampleMetrics = [
			{
				id: createId(),
				projectId: project.id,
				metricName: "http_requests_total",
				metricType: "counter",
				metricValue: "1250",
				timestamp: new Date(),
				serviceName: "user-service",
				serviceVersion: "1.0.0",
				attributes: {
					"method": "GET",
					"endpoint": "/api/users",
					"status_code": "200",
				},
			},
			{
				id: createId(),
				projectId: project.id,
				metricName: "response_time_ms",
				metricType: "histogram",
				metricValue: "45.2",
				timestamp: new Date(),
				serviceName: "user-service",
				serviceVersion: "1.0.0",
				attributes: {
					"endpoint": "/api/users",
				},
			},
		];

		// Sample log data
		const sampleLogs = [
			{
				id: createId(),
				projectId: project.id,
				traceId: "trace123456789abcdef",
				spanId: "span12345678",
				timestamp: new Date(Date.now() - 4500),
				severityText: "INFO",
				severityNumber: 9,
				body: "User request processed successfully",
				serviceName: "user-service",
				serviceVersion: "1.0.0",
				attributes: {
					"user.id": "user123",
					"request.id": "req-456",
				},
			},
			{
				id: createId(),
				projectId: project.id,
				timestamp: new Date(Date.now() - 3600000), // 1 hour ago
				severityText: "ERROR",
				severityNumber: 17,
				body: "Database connection timeout",
				serviceName: "user-service",
				serviceVersion: "1.0.0",
				attributes: {
					"error.type": "TimeoutError",
					"db.connection_string": "hidden",
				},
			},
		];

		// Sample error data
		const sampleErrors = [
			{
				id: createId(),
				projectId: project.id,
				traceId: "trace987654321fedcba",
				spanId: "span11111111",
				title: "Database Connection Timeout",
				message: "Failed to connect to database after 30 seconds",
				stackTrace: `TimeoutError: Database connection timeout
    at Database.connect (/app/src/db.js:45:12)
    at UserService.getUsers (/app/src/services/user.js:23:8)
    at /app/src/routes/users.js:15:21`,
				fingerprint: "db-timeout-error",
				level: "error",
				source: "backend",
				serviceName: "user-service",
				url: "/api/users",
				context: {
					"db.host": "localhost",
					"db.port": 5432,
					"timeout_ms": 30000,
				},
			},
		];

		// Insert sample data
		await db.insert(traces).values(sampleTraces);
		console.log(`✅ Created ${sampleTraces.length} sample traces`);

		await db.insert(metrics).values(sampleMetrics);
		console.log(`✅ Created ${sampleMetrics.length} sample metrics`);

		await db.insert(logs).values(sampleLogs);
		console.log(`✅ Created ${sampleLogs.length} sample logs`);

		await db.insert(errors).values(sampleErrors);
		console.log(`✅ Created ${sampleErrors.length} sample errors`);

		console.log("🎉 Sample observability data created successfully!");

		// Show summary
		const traceCount = await db.select().from(traces).where(eq(traces.projectId, project.id));
		const metricCount = await db.select().from(metrics).where(eq(metrics.projectId, project.id));
		const logCount = await db.select().from(logs).where(eq(logs.projectId, project.id));
		const errorCount = await db.select().from(errors).where(eq(errors.projectId, project.id));

		console.log("\n📈 Data Summary:");
		console.log(`  Project: ${project.name} (${project.id})`);
		console.log(`  Traces: ${traceCount.length}`);
		console.log(`  Metrics: ${metricCount.length}`);
		console.log(`  Logs: ${logCount.length}`);
		console.log(`  Errors: ${errorCount.length}`);

	} catch (error) {
		console.error("❌ Error creating sample data:", error);
		throw error;
	}
}

// Run if called directly
if (import.meta.main) {
	createSampleData()
		.then(() => {
			console.log("✅ Sample data creation complete");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Sample data creation failed:", error);
			process.exit(1);
		});
}

export { createSampleData };
