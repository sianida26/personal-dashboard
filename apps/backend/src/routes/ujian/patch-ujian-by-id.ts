import { updateUjianSchema } from "@repo/validation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { ujian } from "../../drizzle/schema/ujian";
import { notFound } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * PATCH /ujian/:id - Update ujian by ID
 */
const patchUjianByIdRoute = createHonoRoute()
	.use(authInfo)
	.patch(
		"/:id",
		checkPermission("ujian.update"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		requestValidator("json", updateUjianSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const data = c.req.valid("json");

			// Check if ujian exists
			const existing = await db.query.ujian.findFirst({
				where: eq(ujian.id, id),
			});

			if (!existing) {
				return notFound({ message: "Ujian not found" });
			}

			const [updated] = await db
				.update(ujian)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(ujian.id, id))
				.returning();

			return c.json(updated);
		},
	);

export default patchUjianByIdRoute;
