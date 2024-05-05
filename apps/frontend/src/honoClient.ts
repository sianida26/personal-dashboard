import { hc } from "hono/client";
import { AppType } from "backend";

const client = hc<AppType>("http://localhost:3000", {
	headers: {
		Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
	},
});

export default client;
