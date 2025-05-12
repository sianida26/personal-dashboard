import microsoftRouter from "./microsoft/route";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import checkPermission from "../../middlewares/checkPermission";
import googleOAuthRoutes from "./google/route";
import { createHonoRoute } from "../../utils/createHonoRoute";
import loginRoute from "./login";
import myProfileRoute from "./my-profile";
import logoutRoute from "./logout";

const authRoutes = createHonoRoute()
	.route("/", loginRoute) // POST /login
	.route("/", myProfileRoute) // GET /my-profile
	.route("/", logoutRoute) // GET /logout
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
