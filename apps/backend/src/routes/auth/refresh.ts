import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError from "../../errors/DashboardError";
import rateLimit from "../../middlewares/rateLimiter";
import {
	buildAuthPayload,
	type UserWithAuthorization,
} from "../../services/auth/authResponseService";
import {
	markRefreshTokenAsRevoked,
	validateRefreshTokenOrThrow,
} from "../../services/auth/tokenService";
import { createHonoRoute } from "../../utils/createHonoRoute";

const refreshSchema = z.object({
	refreshToken: z.string().min(1),
});

const refreshRoute = createHonoRoute()
	.use(
		rateLimit({
			limit: 60, // 60 refresh requests per minute per IP
		}),
	)
	.post("/refresh", zValidator("json", refreshSchema), async (c) => {
		const { refreshToken } = c.req.valid("json");

		const record = await validateRefreshTokenOrThrow(refreshToken);
		await markRefreshTokenAsRevoked(record.id);

		const user = await db.query.users.findFirst({
			where: and(
				eq(users.id, record.userId),
				eq(users.isEnabled, true),
				isNull(users.deletedAt),
			),
			with: {
				permissionsToUsers: {
					with: {
						permission: true,
					},
				},
				rolesToUsers: {
					with: {
						role: {
							with: {
								permissionsToRoles: {
									with: {
										permission: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!user) {
			throw new DashboardError({
				message: "User not found",
				statusCode: 404,
				severity: "LOW",
				errorCode: "USER_NOT_FOUND",
			});
		}

		const authPayload = await buildAuthPayload(
			user as UserWithAuthorization,
		);

		return c.json(authPayload);
	});

export default refreshRoute;
