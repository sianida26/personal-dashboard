import { hc } from "hono/client";
import { AppType } from "backend";

const client = hc<AppType>("http://localhost:3000", {
	headers: {
		Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJkeG5icHQ0N3BwdXZ6NW1vbTF1NjF5cnMiLCJpYXQiOjE3MTQ1NjY4MDB9.920-iiSuLiPK0t0GiWIuT_n8BHngPxp1FyvYZ7SBJ7E`,
	},
});

export default client;
