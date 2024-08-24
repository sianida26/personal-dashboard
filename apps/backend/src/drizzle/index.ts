import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as usersSchema from "./schema/users";
import * as permissionsSchema from "./schema/permissions";
import * as rolesSchema from "./schema/roles";
import * as permissionsToRolesSchema from "./schema/permissionsToRoles";
import * as permissionsToUsersSchema from "./schema/permissionsToUsers";
import * as rolesToUsersSchema from "./schema/rolesToUsers";

configDotenv();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) throw new Error("DATABASE_URL is not set");

const queryClient = postgres(dbUrl);
const db = drizzle(queryClient, {
	schema: {
		...usersSchema,
		...permissionsSchema,
		...rolesSchema,
		...permissionsToRolesSchema,
		...permissionsToUsersSchema,
		...rolesToUsersSchema,
	},
});

export default db;
