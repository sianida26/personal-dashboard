import getSidebarItems from "./get-sidebar-items";
import { createHonoRoute } from "../../utils/createHonoRoute";

const router = createHonoRoute();

const dashboardRoutes = router.route("/dashboard", getSidebarItems);

export default dashboardRoutes;
