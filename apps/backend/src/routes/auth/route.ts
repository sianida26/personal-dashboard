import { notFound } from "../../errors/DashboardError";
import microsoftRouter from "./microsoft/route";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import checkPermission from "../../middlewares/checkPermission";
import googleOAuthRoutes from "./google/route";
import { createHonoRoute } from "../../utils/createHonoRoute";
import loginRoute from "./login";
import myProfileRoute from "./my-profile";

const authRoutes = createHonoRoute()
	.route("/", loginRoute) // POST /login
	.route("/", myProfileRoute) // GET /my-profile
	.get("/logout", (c) => {
		const uid = c.var.uid;

		if (!uid) {
			throw notFound();
		}

		return c.json({
			message: "Logged out successfully",
		});
	})
	.get("/login-settings", checkPermission("guest-only"), async (c) => {
		const enableGoogleOAuth = await getAppSettingValue(
			"oauth.google.enabled",
		);
		const enableMicrosoftOAuth = await getAppSettingValue(
			"oauth.microsoft.enabled",
		);
		const enableUsernameAndPasswordLogin = await getAppSettingValue(
			"login.usernameAndPassword.enabled",
		);

		return c.json({
			enableGoogleOAuth: enableGoogleOAuth === "true",
			enableMicrosoftOAuth: enableMicrosoftOAuth === "true",
			enableUsernameAndPasswordLogin:
				enableUsernameAndPasswordLogin === "true",
		});
	})
	//Google OAuth Routes
	.route("/google", googleOAuthRoutes)
	//Microsoft OAuth Routes
	.route("/microsoft", microsoftRouter);

export default authRoutes;
