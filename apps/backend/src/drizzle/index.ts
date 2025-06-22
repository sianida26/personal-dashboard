import { configDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import appEnv from "../appEnv";
import * as appSettingsSchema from "./schema/appSettingsSchema";
import * as permissionsSchema from "./schema/permissions";
import * as permissionsToRolesSchema from "./schema/permissionsToRoles";
import * as permissionsToUsersSchema from "./schema/permissionsToUsers";
import * as rolesSchema from "./schema/roles";
import * as rolesToUsersSchema from "./schema/rolesToUsers";
import * as usersSchema from "./schema/users";
import * as microsoftAdmin from "./schema/microsoftAdmin";
import * as oauthGoogleSchema from "./schema/oauthGoogle";
import * as oauthMicrosoftSchema from "./schema/oauthMicrosoft";
import * as kvStore from "./schema/kvStore";
// Observability schemas
import * as projectsSchema from "./schema/projects";
import * as projectMembersSchema from "./schema/project-members";
import * as tracesSchema from "./schema/traces";
import * as metricsSchema from "./schema/metrics";
import * as logsSchema from "./schema/logs";
import * as errorsSchema from "./schema/errors";
import * as dashboardsSchema from "./schema/dashboards";
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
		...appSettingsSchema,
		...microsoftAdmin,
		...oauthGoogleSchema,
		...oauthMicrosoftSchema,
		...kvStore,
		// Observability schemas
		...projectsSchema,
		...projectMembersSchema,
		...tracesSchema,
		...metricsSchema,
		...logsSchema,
		...errorsSchema,
		...dashboardsSchema,
	},
	logger: new SqlLogger(),
});

export default db;
