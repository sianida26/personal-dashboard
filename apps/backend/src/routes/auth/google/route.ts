import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import { googleAuth } from "@hono/oauth-providers/google";
import { getAppSettingValue } from "../../../services/appSettings/appSettingServices";
import DashboardError from "../../../errors/DashboardError";

const googleOAuthRoutes = new Hono<HonoEnv>().use(async (c, next) => {
	const isGoogleOAuthEnabled = await getAppSettingValue(
		"oauth.google.enabled",
	);

	if (!isGoogleOAuthEnabled) {
		throw new DashboardError({
			message: "Google OAuth is not enabled",
			statusCode: 400,
			errorCode: "GOOGLE_OAUTH_NOT_ENABLED",
			severity: "LOW",
		});
	}

	const clientId = await getAppSettingValue("oauth.google.clientId");
	const clientSecret = await getAppSettingValue("oauth.google.clientSecret");

	if (!clientId || !clientSecret) {
		throw new DashboardError({
			message: "Google OAuth is not configured",
			statusCode: 500,
			errorCode: "GOOGLE_OAUTH_NOT_CONFIGURED",
			severity: "CRITICAL",
		});
	}

	return googleAuth({
		client_id: clientId,
		client_secret: clientSecret,
		scope: ["email", "profile", "openid"],
	})(c, next);
});

export default googleOAuthRoutes;
