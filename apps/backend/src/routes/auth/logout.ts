import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import { authMetrics } from "../../utils/custom-metrics";

const logoutRoute = createHonoRoute()
	.use(authInfo)
	.get("/logout", checkPermission("authenticated-only"), async (c) => {
		// Track logout and decrease active users count
		authMetrics.activeUsers.add(-1);

		return c.json({
			message: "Logged out successfully",
		});
	});

export default logoutRoute;
