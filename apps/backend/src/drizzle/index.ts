import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import appEnv from "../appEnv";
import * as permissionsSchema from "./schema/permissions";
import * as permissionsToRolesSchema from "./schema/permissionsToRoles";
import * as permissionsToUsersSchema from "./schema/permissionsToUsers";
import * as rolesSchema from "./schema/roles";
import * as rolesToUsersSchema from "./schema/rolesToUsers";
import * as usersSchema from "./schema/users";
import SqlLogger from "./utils/SqlLogger";

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
	logger: new SqlLogger(),
});

export default db;
