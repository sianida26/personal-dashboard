import checkPermission from "../../middlewares/checkPermission";
import { getAppSettingValue } from "../../services/appSettings/appSettingServices";
import { createHonoRoute } from "../../utils/createHonoRoute";

const loginSettingsRoute = createHonoRoute().get(
	"/login-settings",
	checkPermission("guest-only"),
	async (c) => {
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
	},
);

export default loginSettingsRoute;
