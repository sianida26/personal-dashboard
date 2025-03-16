import { eq } from "drizzle-orm";
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

	// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
	console.log("Seeding users...");

	const memoizedRoleIds: Map<string, string> = new Map();

	for (const user of usersData) {
		const insertedUser = (
			await db
				.insert(users)
				.values(usersData)
				.onConflictDoNothing()
				.returning()
		)[0];

		if (insertedUser) {
			for (const roleCode of user.roles) {
				if (!memoizedRoleIds.has(roleCode)) {
					const role = (
						await db
							.select({ id: rolesSchema.id })
							.from(rolesSchema)
							.where(eq(rolesSchema.code, roleCode))
					)[0];

					if (!role)
						throw new Error(
							`Role ${roleCode} does not exists on database`,
						);

					memoizedRoleIds.set(roleCode, role.id);
				}

				const roleId = memoizedRoleIds.get(roleCode);
				if (!roleId)
					throw new Error(`Role ${roleCode} not found in memo`);
				await db.insert(rolesToUsers).values({
					roleId,
					userId: insertedUser.id,
				});
				// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
				console.log(`User ${user.name} created`);
			}
		} else {
			// biome-ignore lint/suspicious/noConsole: for displaying messages in console window
			console.log(`User ${user.name} already exists`);
		}
	}

	// await db.insert(users).values(usersData).onConflictDoNothing().returning();
};

export default userSeeder;
