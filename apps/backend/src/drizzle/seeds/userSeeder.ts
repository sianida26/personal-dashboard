import { inArray } from "drizzle-orm";
import db from "..";
import { hashPassword } from "../..//utils/passwordUtils";
import { rolesSchema } from "../schema/roles";
import { rolesToUsers } from "../schema/rolesToUsers";
import { users } from "../schema/users";

const userSeeder = async () => {
	const usersData: (typeof users.$inferInsert & { roles: string[] })[] = [
		{
			name: "Super Admin",
			password: await hashPassword("123456"),
			username: "superadmin",
			roles: ["super-admin"],
		},
	];

	console.log("Seeding users...");

	// Step 1: Batch insert all users (excluding roles field)
	const usersToInsert = usersData.map(({ roles, ...user }) => user);
	const insertedUsers = await db
		.insert(users)
		.values(usersToInsert)
		.onConflictDoNothing()
		.returning();

	console.log(`${insertedUsers.length} new users inserted`);

	// Step 2: Get all existing users (including newly inserted ones)
	const allUsernames = usersData.map(user => user.username);
	const existingUsers = await db
		.select()
		.from(users)
		.where(inArray(users.username, allUsernames));

	// Create a map for quick user lookup
	const userMap = new Map(existingUsers.map(user => [user.username, user.id]));

	// Step 3: Get all unique role codes needed
	const allRoleCodes = [...new Set(
		usersData.flatMap(user => user.roles)
	)];

	// Step 4: Batch fetch all required roles
	const existingRoles = await db
		.select({ id: rolesSchema.id, code: rolesSchema.code })
		.from(rolesSchema)
		.where(inArray(rolesSchema.code, allRoleCodes));

	// Create a map for quick role lookup
	const roleMap = new Map(existingRoles.map(role => [role.code, role.id]));

	// Step 5: Validate all roles exist
	const missingRoles = allRoleCodes.filter(code => !roleMap.has(code));
	if (missingRoles.length > 0) {
		throw new Error(
			`The following roles do not exist in database: ${missingRoles.join(', ')}`
		);
	}

	// Step 6: Prepare all user-role relationships for batch insert
	const userRoleRelations: Array<{ userId: string; roleId: string }> = [];
	
	for (const user of usersData) {
		const userId = userMap.get(user.username);
		if (!userId) {
			throw new Error(`User ${user.username} not found in database`);
		}

		for (const roleCode of user.roles) {
			const roleId = roleMap.get(roleCode);
			if (!roleId) {
				throw new Error(`Role ${roleCode} not found in memo`);
			}

			userRoleRelations.push({
				userId,
				roleId,
			});
		}
	}

	// Step 7: Batch insert all user-role relationships
	if (userRoleRelations.length > 0) {
		const insertedUserRoles = await db
			.insert(rolesToUsers)
			.values(userRoleRelations)
			.onConflictDoNothing()
			.returning();

		console.log(`${insertedUserRoles.length} new user-role relationships created`);
	}

	console.log("User seeding completed successfully");
};

export default userSeeder;
