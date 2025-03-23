import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import { notFound, unauthorized } from "../../../errors/DashboardError";
import { createGraphClientForAdmin } from "../../../services/microsoft/graphClient";
import db from "../../../drizzle";
import { eq } from "drizzle-orm";
import { users } from "../../../drizzle/schema/users";
import authInfo from "../../../middlewares/authInfo";
import { isUserAdmin } from "../../../services/microsoft/authHelpers";

/**
 * Microsoft Graph Admin Router
 *
 * These routes provide admin-specific functionality using Microsoft Graph API
 * with application permissions (instead of delegated permissions).
 *
 * All routes are protected and require:
 * 1. Valid JWT authentication
 * 2. User to have admin privileges
 */
const adminRouter = new Hono<HonoEnv>()
	.use(authInfo)
	// Add admin access check middleware
	.use(async (c, next) => {
		try {
			const userId = c.var.uid;

			if (!userId) {
				throw unauthorized({
					message: "User not found",
				});
			}

			// Check if user has admin access
			const hasAdminAccess = await isUserAdmin(userId);

			if (!hasAdminAccess) {
				throw unauthorized({
					message: "User does not have administrator privileges",
				});
			}

			await next();
		} catch (error) {
			throw unauthorized({
				message: "Admin access required",
			});
		}
	})
	// Get all users endpoint using admin privileges
	.get("/users", async (c) => {
		try {
			// Get Microsoft Graph client with admin privileges
			const graphClient = await createGraphClientForAdmin();

			// Call Microsoft Graph API to get users
			const response = await graphClient
				.api("/users")
				.select("id,displayName,mail,userPrincipalName")
				.top(50) // Limit to 50 users
				.get();

			return c.json(response.value);
		} catch (error) {
			return c.json(
				{
					error: "Failed to fetch users",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 },
			);
		}
	})
	// Example admin action endpoint
	.post("/action", async (c) => {
		try {
			// This is just an example action - in a real application,
			// you would perform some meaningful admin operation here

			// Get admin Graph client
			const graphClient = await createGraphClientForAdmin();

			// Example: Get organization information
			const orgInfo = await graphClient
				.api("/organization")
				.select("id,displayName,verifiedDomains")
				.get();

			return c.json({
				success: true,
				message: `Action completed for organization: ${orgInfo.value[0].displayName}`,
				data: orgInfo.value[0],
			});
		} catch (error) {
			return c.json(
				{
					error: "Failed to perform admin action",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 },
			);
		}
	});

export default adminRouter; 