import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import { authMetrics } from "../../utils/custom-metrics";
import DashboardError from "../../errors/DashboardError";
import {
	markRefreshTokenAsRevoked,
	validateRefreshTokenOrThrow,
} from "../../services/auth/tokenService";

const logoutSchema = z.object({
	refreshToken: z.string().min(1),
});

const logoutRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/logout",
		checkPermission("authenticated-only"),
		zValidator("json", logoutSchema),
		async (c) => {
			const { refreshToken } = c.req.valid("json");
			const record = await validateRefreshTokenOrThrow(refreshToken);
			const uid = c.get("uid");

			if (!uid || uid !== record.userId) {
				throw new DashboardError({
					message: "Cannot revoke refresh token",
					statusCode: 401,
					severity: "LOW",
					errorCode: "INVALID_REFRESH_TOKEN",
				});
			}

			await markRefreshTokenAsRevoked(record.id);

			// Track logout and decrease active users count
			authMetrics.activeUsers.add(-1);

			return c.json({
				message: "Logged out successfully",
			});
		},
	);

export default logoutRoute;
