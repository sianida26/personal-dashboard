import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";

/**
 * Checks if a user has admin permissions based on their roles or direct permissions
 * @param userId The user ID to check
 * @returns True if the user has admin permissions, false otherwise
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
	// Get user with permissions and roles
	const userRecord = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			permissionsToUsers: {
				with: {
					permission: true,
				},
			},
			rolesToUsers: {
				with: {
					role: {
						with: {
							permissionsToRoles: {
								with: {
									permission: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!userRecord) return false;

	// Check for admin permission or role
	const hasAdminPermission = userRecord.permissionsToUsers.some(
		(p) => p.permission.code === "ADMIN_ACCESS",
	);

	// Check roles for admin permissions
	const hasAdminRole = userRecord.rolesToUsers.some(
		(r) =>
			r.role.name === "Admin" ||
			r.role.permissionsToRoles.some(
				(p) => p.permission.code === "ADMIN_ACCESS",
			),
	);

	return hasAdminPermission || hasAdminRole;
} 