import { Hono } from "hono";
import authInfo from "../../middlewares/authInfo";
import HonoEnv from "../../types/HonoEnv";
import { z } from "zod";
import requestValidator from "../../utils/requestValidator";
import checkPermission from "../../middlewares/checkPermission";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";

const devRoutes = new Hono<HonoEnv>()
	.use(authInfo)
	.use(checkPermission("dev-routes"))
	.get(
		"/test",
		checkPermission("users.readAll"),
		requestValidator(
			"query",
			z.object({
				includeTrashed: z
					.string()
					.default("false")
					.transform((val) => val === "true"),
				withMetadata: z
					.string()
					.default("false")
					.transform((val) => val === "true"),
				page: z.coerce.number().int().min(1).optional(),
				limit: z.coerce.number().int().min(1).max(1000).optional(),
				q: z.string().optional(),
			})
		),
		async (c) => {
			const { includeTrashed, page, limit, q, withMetadata } =
				c.req.valid("query");

			const result = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					username: true,
					isEnabled: true,
					createdAt: true,
					updatedAt: true,
					deletedAt: includeTrashed,
				},
				extras: {
					fullCount: db
						.$count(
							users,
							includeTrashed ? isNull(users.deletedAt) : undefined
						)
						.as("fullCount"),
				},
				where: and(
					includeTrashed ? undefined : isNull(users.deletedAt),
					q
						? or(
								ilike(users.name, q),
								ilike(users.username, q),
								ilike(users.email, q),
								eq(users.id, q)
							)
						: undefined
				),
				offset: page && limit ? page + limit : undefined,
				limit: limit,
			});

			const data = result.map((d) => ({ ...d, fullCount: undefined }));

			if (withMetadata) {
				return c.json({
					data,
					_metadata: {
						currentPage: page ?? 0,
						totalPages:
							page && limit
								? Math.ceil(
										(Number(result[0]?.fullCount) ?? 0) /
											limit
									)
								: 0,
						totalItems: Number(result[0]?.fullCount) ?? 0,
						perPage: limit ?? 0,
					},
				});
			}

			return c.json(data);
		}
	);

export default devRoutes;
