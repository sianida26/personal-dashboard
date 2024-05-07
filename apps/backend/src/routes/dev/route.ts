import { Hono } from "hono";
import DashboardError from "../../errors/DashboardError";

const devRoutes = new Hono().get("/error", async () => {
	throw new DashboardError({
		errorCode: "TEST_ERROR",
		message: "Test error",
		severity: "LOW",
		statusCode: 400,
		formErrors: {
			someField: "error",
		},
	});
});

export default devRoutes;
