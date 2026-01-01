import { and, eq } from "drizzle-orm";
import { z } from "zod";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import {
	badRequest,
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * DELETE /money/categories/:id - Delete (soft) a category
 * Sets isActive to false
 */
const deleteCategoryRoute = createHonoRoute()
	.use(authInfo)
	.delete(
		"/:id",
		requestValidator("param", z.object({ id: z.string() })),
		async (c) => {
			const uid = c.get("uid");
			if (!uid) throw unauthorized();
			const { id } = c.req.valid("param");

			// Check if category exists and belongs to user
			const existingCategory = await db.query.moneyCategories.findFirst({
				where: and(
					eq(moneyCategories.id, id),
					eq(moneyCategories.userId, uid),
				),
			});

			if (!existingCategory) {
				notFound({ message: "Category not found" });
			}

			// Check if category has active children
			const hasActiveChildren = await db.query.moneyCategories.findFirst({
				where: and(
					eq(moneyCategories.parentId, id),
					eq(moneyCategories.userId, uid),
					eq(moneyCategories.isActive, true),
				),
			});

			if (hasActiveChildren) {
				badRequest({
					message:
						"Cannot delete category with active subcategories. Please delete or deactivate subcategories first.",
				});
			}

			// Soft delete - set isActive to false
			await db
				.update(moneyCategories)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(eq(moneyCategories.id, id));

			return c.json({ message: "Category deleted successfully" });
		},
	);

export default deleteCategoryRoute;
