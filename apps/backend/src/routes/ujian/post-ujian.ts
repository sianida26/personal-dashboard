import { createUjianSchema } from "@repo/validation";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * POST /ujian - Create new ujian
 */
const postUjianRoute = createHonoRoute()
	.use(authInfo)
	.post(
		"/",
		checkPermission("ujian.create"),
		requestValidator("json", createUjianSchema),
		async (c) => {
			const data = c.req.valid("json");
			const uid = c.get("uid");

			const [newUjian] = await db
				.insert(ujian)
				.values({
					...data,
					createdBy: uid,
				})
				.returning();

			return c.json(newUjian, 201);
		},
	);

export default postUjianRoute;
