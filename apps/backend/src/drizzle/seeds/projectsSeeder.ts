import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "node:crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { projects } from "../schema/projects";
import { projectMembers } from "../schema/project-members";
import { users } from "../schema/users";
import { eq } from "drizzle-orm";

/**
 * Generate a secure API key for projects
 */
function generateApiKey(): string {
	return randomBytes(32).toString("hex");
}

/**
 * Seed default projects for development
 */
export async function seedProjects(db: PostgresJsDatabase<any>) {
	try {
		console.log("🌱 Seeding projects...");

		// Check if projects already exist
		const existingProjects = await db.select().from(projects).limit(1);
		if (existingProjects.length > 0) {
			console.log("📋 Projects already exist, skipping seed");
			return;
		}

		// Get existing users to assign as project owners
		const existingUsers = await db.select().from(users).limit(5);
		if (existingUsers.length === 0) {
			console.log("⚠️ No users found, skipping project seeding");
			return;
		}

		// Create default demo projects
		const defaultProjects = [
			{
				id: createId(),
				name: "Demo E-commerce App",
				slug: "demo-ecommerce",
				description: "Demo project for e-commerce application monitoring",
				apiKey: generateApiKey(),
				status: "active" as const,
				retentionDays: 30,
				maxSpansPerHour: 100000,
				maxMetricsPerHour: 50000,
				maxLogsPerHour: 200000,
			},
			{
				id: createId(),
				name: "Blog Platform",
				slug: "blog-platform",
				description: "Observability for blog platform application",
				apiKey: generateApiKey(),
				status: "active" as const,
				retentionDays: 60,
				maxSpansPerHour: 50000,
				maxMetricsPerHour: 25000,
				maxLogsPerHour: 100000,
			},
			{
				id: createId(),
				name: "Mobile API",
				slug: "mobile-api",
				description: "Backend API for mobile applications",
				apiKey: generateApiKey(),
				status: "active" as const,
				retentionDays: 45,  
				maxSpansPerHour: 75000,
				maxMetricsPerHour: 40000,
				maxLogsPerHour: 150000,
			},
		];

		// Insert projects
		const insertedProjects = await db.insert(projects).values(defaultProjects).returning();
		console.log(`✅ Created ${insertedProjects.length} projects`);

		// Assign first user as owner of all projects
		const ownerUser = existingUsers[0];
		const projectMemberData = insertedProjects.map((project) => ({
			id: createId(),
			projectId: project.id,
			userId: ownerUser.id,
			role: "owner" as const,
		}));

		await db.insert(projectMembers).values(projectMemberData);
		console.log(`✅ Assigned project memberships for ${projectMemberData.length} projects`);

		// Add additional members to first project if we have more users
		if (existingUsers.length > 1 && insertedProjects.length > 0) {
			const additionalMembers = existingUsers.slice(1, 3).map((user, index) => ({
				id: createId(),
				projectId: insertedProjects[0].id,
				userId: user.id,
				role: index === 0 ? ("admin" as const) : ("member" as const),
			}));

			await db.insert(projectMembers).values(additionalMembers);
			console.log(`✅ Added ${additionalMembers.length} additional members to demo project`);
		}

		console.log("🎉 Projects seeded successfully!");
		console.log("\n📋 Created Projects:");
		for (const project of insertedProjects) {
			console.log(`  - ${project.name} (${project.slug})`);
			console.log(`    API Key: ${project.apiKey}`);
			console.log(`    Status: ${project.status}`);
			console.log("");
		}

	} catch (error) {
		console.error("❌ Error seeding projects:", error);
		throw error;
	}
}
