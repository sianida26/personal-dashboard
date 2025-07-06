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
import * as observabilityEventsSchema from "./schema/observability-events";
import * as requestDetailsSchema from "./schema/request-details";
import * as jobQueueSchema from "./schema/job-queue";
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
		...observabilityEventsSchema,
		...requestDetailsSchema,
		...jobQueueSchema,
	},
	logger: new SqlLogger(),
});

export default db;
