import { hashPassword } from "../..//utils/passwordUtils";
import { users } from "../schema/users";
import db from "..";
import { rolesSchema } from "../schema/roles";
import { eq } from "drizzle-orm";
import { rolesToUsers } from "../schema/rolesToUsers";

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

	const memoizedRoleIds: Map<string, string> = new Map();

	for (let user of usersData) {
		const insertedUser = (
			await db
				.insert(users)
				.values(usersData)
				.onConflictDoNothing()
				.returning()
		)[0];

		if (insertedUser) {
			for (let roleCode of user.roles) {
				if (!memoizedRoleIds.has(roleCode)) {
					const role = (
						await db
							.select({ id: rolesSchema.id })
							.from(rolesSchema)
							.where(eq(rolesSchema.code, roleCode))
					)[0];

					if (!role)
						throw new Error(
							`Role ${roleCode} does not exists on database`
						);

					memoizedRoleIds.set(roleCode, role.id);
				}

				await db.insert(rolesToUsers).values({
					roleId: memoizedRoleIds.get(roleCode)!,
					userId: insertedUser.id,
				});
				console.log(`User ${user.name} created`);
			}
		} else {
			console.log(`User ${user.name} already exists`);
		}
	}

	// await db.insert(users).values(usersData).onConflictDoNothing().returning();
};

export default userSeeder;
