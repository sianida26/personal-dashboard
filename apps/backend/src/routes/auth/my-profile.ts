import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";

/**
 * My Profile Route
 *
 * GET /auth/my-profile
 *
 * Returns the current user's profile information.
 * Requires authentication.
 *
 * @returns {Object} User profile data including:
 *   - id: User ID
 *   - name: User's full name
 *   - username: User's username
 *   - email: User's email address
 *   - permissions: Array of user permissions
 *   - roles: Array of user roles
 *   - Other user profile fields
 */
const myProfileRoute = createHonoRoute().get(
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
);

export default myProfileRoute;