import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError from "../../errors/DashboardError";
import rateLimit, {
	refreshRateLimitConfig,
} from "../../middlewares/rateLimiter";
import {
	buildAuthPayloadWithExistingRefreshToken,
	type UserWithAuthorization,
} from "../../services/auth/authResponseService";
import { validateRefreshTokenOrThrow } from "../../services/auth/tokenService";
import { createHonoRoute } from "../../utils/createHonoRoute";

const refreshSchema = z.object({
	refreshToken: z.string().min(1),
});

const refreshRoute = createHonoRoute()
	.use(rateLimit(refreshRateLimitConfig))
	.post("/refresh", zValidator("json", refreshSchema), async (c) => {
		const { refreshToken } = c.req.valid("json");

		// Validate token but don't revoke it - allows multiple tabs/devices to use the same token
		const record = await validateRefreshTokenOrThrow(refreshToken);

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

		// Reuse the same refresh token - supports multiple tabs/devices
		const authPayload = await buildAuthPayloadWithExistingRefreshToken(
			user as UserWithAuthorization,
			refreshToken,
			record.expiresAt,
		);

		return c.json(authPayload);
	});

export default refreshRoute;
