import microsoftRouter from "./microsoft/route";
import googleOAuthRoutes from "./google/route";
import { createHonoRoute } from "../../utils/createHonoRoute";
import loginRoute from "./login";
import myProfileRoute from "./my-profile";
import logoutRoute from "./logout";
import loginSettingsRoute from "./login-settings";

const authRoutes = createHonoRoute()
	.route("/", loginRoute) // POST /login
	.route("/", myProfileRoute) // GET /my-profile
	.route("/", logoutRoute) // GET /logout
	.route("/", loginSettingsRoute) // GET /login-settings
	//Google OAuth Routes
	.route("/google", googleOAuthRoutes)
	//Microsoft OAuth Routes
	.route("/microsoft", microsoftRouter);

export default authRoutes;
