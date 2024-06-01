import { Hono } from "hono";
import authInfo from "../../middlewares/authInfo";
import HonoEnv from "../../types/HonoEnv";
import { z } from "zod";
import requestValidator from "../../utils/requestValidator";
import checkPermission from "../../middlewares/checkPermission";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

const devRoutes = new Hono<HonoEnv>()
	.use(authInfo)
	.use(checkPermission("dev-routes"))
	.get(
		"/test",
		checkPermission("users.readAll"),
		requestValidator(
			"query",
			z.object({
				includeTrashed: z.string().default("false"),
				withMetadata: z.string().default("false"),
				page: z.coerce.number().int().min(1).optional(),
				limit: z.coerce.number().int().min(1).max(1000).optional(),
			})
		),
		async (c) => {
			const userQuery = db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					isEnabled: users.isEnabled,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
					fullCount: sql<number>`null`,
				})
				.from(users);

			const totalCount = db
				.select({
					id: sql<string>`null`,
					name: sql<string>`null`,
					email: sql<string>`null`,
					username: sql<string>`null`,
					isEnabled: sql<boolean>`null`,
					createdAt: sql<Date>`null`,
					updatedAt: sql<Date>`null`,
					fullCount: sql<number>`count(*)`,
				})
				.from(users);

			const result = await unionAll(userQuery, totalCount);

			return c.json(result);
		}
	);

export default devRoutes;
