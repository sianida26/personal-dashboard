import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";

const logoutRoute = createHonoRoute()
	.use(authInfo)
	.get("/logout", checkPermission("authenticated-only"), async (c) => {
		return c.json({
			message: "Logged out successfully",
		});
	});

export default logoutRoute;
