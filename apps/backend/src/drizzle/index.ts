import { drizzle } from "drizzle-orm/postgres-js";
import appEnv from "../appEnv";
import * as appSettingsSchema from "./schema/appSettingsSchema";
import * as jobQueueSchema from "./schema/job-queue";
import * as kvStore from "./schema/kvStore";
import * as microsoftAdmin from "./schema/microsoftAdmin";
import * as notificationsSchema from "./schema/notifications";
import * as oauthGoogleSchema from "./schema/oauthGoogle";
import * as oauthMicrosoftSchema from "./schema/oauthMicrosoft";
import * as permissionsSchema from "./schema/permissions";
import * as permissionsToRolesSchema from "./schema/permissionsToRoles";
import * as permissionsToUsersSchema from "./schema/permissionsToUsers";
import * as refreshTokensSchema from "./schema/refreshTokens";
import * as rolesSchema from "./schema/roles";
import * as rolesToUsersSchema from "./schema/rolesToUsers";
import * as usersSchema from "./schema/users";
import SqlLogger from "./utils/SqlLogger";

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
		...jobQueueSchema,
		...notificationsSchema,
		...refreshTokensSchema,
	},
	logger: new SqlLogger(),
});

export default db;
