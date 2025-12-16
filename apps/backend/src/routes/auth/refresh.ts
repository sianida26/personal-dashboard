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
		let record;
		try {
			record = await validateRefreshTokenOrThrow(refreshToken);
		} catch (error) {
			// Log refresh token validation failures for debugging
			console.warn("[auth/refresh] Token validation failed:", {
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			throw error;
		}

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
			console.warn("[auth/refresh] User not found or disabled:", {
				userId: record.userId,
				timestamp: new Date().toISOString(),
			});
			throw new DashboardError({
				message: "User not found or account disabled",
				statusCode: 401,
				severity: "LOW",
				errorCode: "USER_NOT_FOUND_OR_DISABLED",
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
