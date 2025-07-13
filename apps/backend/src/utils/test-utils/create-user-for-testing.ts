import { createId } from "@paralleldrive/cuid2";
import type { PermissionCode } from "@repo/data";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { permissionsToUsers } from "../../drizzle/schema/permissionsToUsers";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { users } from "../../drizzle/schema/users";
import { generateAccessToken } from "../authUtils";
import { hashPassword } from "../passwordUtils";

export interface CreateUserOptions {
	/** User's display name */
	name?: string;
	/** Username for login (must be unique) */
	username?: string;
	/** Email address (optional) */
	email?: string;
	/** Plain text password */
	password?: string;
	/** Whether the user is enabled */
	isEnabled?: boolean;
	/** Array of role codes to assign to the user */
	roles?: string[];
	/** Array of permission codes to assign directly to the user */
	permissions?: PermissionCode[];
}

export interface TestUserData {
	/** Complete user object from database */
	user: typeof users.$inferSelect & {
		/** All permissions (from roles + direct permissions) */
		permissions: PermissionCode[];
		/** Role names assigned to the user */
		roles: string[];
	};
	/** JWT access token for authentication */
	accessToken: string;
}

/** Type alias for the return type of createUserForTesting function - useful for type inference in test files */
export type UserForTesting = Awaited<ReturnType<typeof createUserForTesting>>;

/**
 * Creates a test user with specified roles and permissions for testing purposes.
 * This utility handles all the database operations and returns the complete user data
 * along with a valid access token for authentication in tests.
 *
 * @param options - Configuration options for creating the test user
 * @returns Promise resolving to user data with access token
 *
 * @example
 * ```typescript
 * // Create a basic test user
 * const { user, accessToken } = await createUserForTesting();
 *
 * // Create user with specific roles
 * const adminUser = await createUserForTesting({
 *   name: "Test Admin",
 *   username: "test-admin",
 *   roles: ["super-admin"]
 * });
 *
 * // Create user with specific permissions
 * const limitedUser = await createUserForTesting({
 *   name: "Limited User",
 *   permissions: ["users.read", "roles.read"]
 * });
 * ```
 */
export async function createUserForTesting(
	options: CreateUserOptions = {},
): Promise<TestUserData> {
	const {
		name = "Test User",
		username = `test_user_${createId()}`,
		email = `${username}@example.com`,
		password = "testPassword123!",
		isEnabled = true,
		roles = [],
		permissions = [],
	} = options;

	// Hash the password
	const hashedPassword = await hashPassword(password);

	// Create the user
	const [createdUser] = await db
		.insert(users)
		.values({
			name,
			username,
			email,
			password: hashedPassword,
			isEnabled,
		})
		.returning();

	if (!createdUser) {
		throw new Error("Failed to create test user");
	}

	// Assign roles if provided
	if (roles.length > 0) {
		for (const roleCode of roles) {
			// Find the role by code
			const role = await db.query.rolesSchema.findFirst({
				where: eq(rolesSchema.code, roleCode),
			});

			if (!role) {
				throw new Error(`Role with code "${roleCode}" not found`);
			}

			// Assign role to user
			await db.insert(rolesToUsers).values({
				userId: createdUser.id,
				roleId: role.id,
			});
		}
	}

	// Assign direct permissions if provided
	if (permissions.length > 0) {
		for (const permissionCode of permissions) {
			// Find the permission by code
			const permission = await db.query.permissionsSchema.findFirst({
				where: eq(permissionsSchema.code, permissionCode),
			});

			if (!permission) {
				throw new Error(
					`Permission with code "${permissionCode}" not found`,
				);
			}

			// Assign permission to user
			await db.insert(permissionsToUsers).values({
				userId: createdUser.id,
				permissionId: permission.id,
			});
		}
	}

	// Fetch the complete user data with all permissions and roles
	const userWithPermissions = await db.query.users.findFirst({
		where: eq(users.id, createdUser.id),
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

	if (!userWithPermissions) {
		throw new Error("Failed to fetch created user with permissions");
	}

	// Collect all permissions (from roles + direct permissions)
	const allPermissions = new Set<PermissionCode>();

	// Add user-specific permissions
	for (const userPermission of userWithPermissions.permissionsToUsers) {
		allPermissions.add(userPermission.permission.code as PermissionCode);
	}

	// Add role-based permissions
	for (const userRole of userWithPermissions.rolesToUsers) {
		for (const rolePermission of userRole.role.permissionsToRoles) {
			allPermissions.add(
				rolePermission.permission.code as PermissionCode,
			);
		}
	}

	// Get role names
	const roleNames = userWithPermissions.rolesToUsers.map(
		(userRole) => userRole.role.name,
	);

	// Generate access token
	const accessToken = await generateAccessToken({
		uid: createdUser.id,
	});

	return {
		user: {
			...createdUser,
			permissions: Array.from(allPermissions),
			roles: roleNames,
		},
		accessToken,
	};
}

/**
 * Cleans up a test user and all associated data from the database.
 * This function removes the user and all their role/permission assignments.
 *
 * @param userId - The ID of the user to delete
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupTestUser(userId: string): Promise<void> {
	// Delete role assignments (cascade should handle this, but explicit for clarity)
	await db.delete(rolesToUsers).where(eq(rolesToUsers.userId, userId));

	// Delete permission assignments (cascade should handle this, but explicit for clarity)
	await db
		.delete(permissionsToUsers)
		.where(eq(permissionsToUsers.userId, userId));

	// Delete the user
	await db.delete(users).where(eq(users.id, userId));
}

/**
 * Cleans up a test user by username.
 * Convenience function for cleanup when you only have the username.
 *
 * @param username - The username of the user to delete
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupTestUserByUsername(
	username: string,
): Promise<void> {
	const user = await db.query.users.findFirst({
		where: eq(users.username, username),
	});

	if (user) {
		await cleanupTestUser(user.id);
	}
}
