import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import * as usersSchema from "./schema/users";
import * as permissionsSchema from "./schema/permissions";
import * as rolesSchema from "./schema/roles";
import * as permissionsToRolesSchema from "./schema/permissionsToRoles";
import * as permissionsToUsersSchema from "./schema/permissionsToUsers";
import * as rolesToUsersSchema from "./schema/rolesToUsers";
import appEnv from "../appEnv";

configDotenv();

const db = drizzle({
	connection: appEnv.DATABASE_URL,
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
