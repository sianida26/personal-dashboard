import db from "../../drizzle";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { Hono } from "hono";

const permissionRoutes = new Hono()
	//get all permissions
	.get("/", async (c) => {
		const permissions = await db
			.select({
				id: permissionsSchema.id,
				code: permissionsSchema.code,
			})
			.from(permissionsSchema);

		return c.json(permissions);
	});

export default permissionRoutes;
