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
 * DELETE /ujian/:id - Delete ujian by ID
 */
const deleteUjianByIdRoute = createHonoRoute()
	.use(authInfo)
	.delete(
		"/:id",
		checkPermission("ujian.delete"),
		requestValidator(
			"param",
			z.object({
				id: z.string(),
			}),
		),
		async (c) => {
			const { id } = c.req.valid("param");

			// Check if ujian exists
			const existing = await db.query.ujian.findFirst({
				where: eq(ujian.id, id),
			});

			if (!existing) {
				return notFound({ message: "Ujian not found" });
			}

			// Delete ujian (will cascade to questions, attempts, and answers)
			await db.delete(ujian).where(eq(ujian.id, id));

			return c.json({ message: "Ujian deleted successfully" });
		},
	);

export default deleteUjianByIdRoute;
