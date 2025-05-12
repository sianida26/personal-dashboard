import { notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import microsoftRouter from "./microsoft/route";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import checkPermission from "../../middlewares/checkPermission";
import googleOAuthRoutes from "./google/route";
import { createHonoRoute } from "../../utils/createHonoRoute";
import loginRoute from "./login";

const authRoutes = createHonoRoute()
	.route("/", loginRoute) // POST /login
	.get(
		"/my-profile",
		authInfo,
		checkPermission("authenticated-only"),
		async (c) => {
			const currentUser = c.var.currentUser;

			if (!currentUser || !c.var.uid) {
				throw unauthorized();
			}

			return c.json({ ...currentUser, id: c.var.uid });
		},
	)
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
