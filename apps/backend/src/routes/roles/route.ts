import { Hono } from "hono";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";

const rolesRoute = new Hono()
	//get all permissions
	.get("/", async (c) => {
		const roles = await db
			.select({
				id: rolesSchema.id,
				code: rolesSchema.code,
				name: rolesSchema.name,
			})
			.from(rolesSchema);

		return c.json(roles);
	});

export default rolesRoute;
