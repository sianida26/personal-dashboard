import { createHonoRoute } from "../../utils/createHonoRoute";
import googleOAuthRoutes from "./google/route";
import loginRoute from "./login";
import loginSettingsRoute from "./login-settings";
import logoutRoute from "./logout";
import microsoftRouter from "./microsoft/route";
import myProfileRoute from "./my-profile";
import refreshRoute from "./refresh";

const authRoutes = createHonoRoute()
	.route("/", loginRoute) // POST /login
	.route("/", myProfileRoute) // GET /my-profile
	.route("/", logoutRoute) // GET /logout
	.route("/", loginSettingsRoute) // GET /login-settings
	.route("/", refreshRoute)
	//Google OAuth Routes
	.route("/google", googleOAuthRoutes)
	//Microsoft OAuth Routes
	.route("/microsoft", microsoftRouter);

export default authRoutes;
