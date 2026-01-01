import { categoryUpdateSchema } from "@repo/validation";
import { and, eq } from "drizzle-orm";
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
 * PUT /money/categories/:id - Update a category
 */
const putCategoryRoute = createHonoRoute()
	.use(authInfo)
	.put("/:id", requestValidator("json", categoryUpdateSchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const id = c.req.param("id");
		const data = c.req.valid("json");

		// Check if category exists and belongs to user
		const existingCategory = await db.query.moneyCategories.findFirst({
			where: and(
				eq(moneyCategories.id, id),
				eq(moneyCategories.userId, uid),
			),
		});

		if (!existingCategory) {
			throw notFound({ message: "Category not found" });
		}

		// If parentId is being changed
		if (data.parentId !== undefined) {
			// Cannot set self as parent
			if (data.parentId === id) {
				throw badRequest({
					message: "Cannot set category as its own parent",
					formErrors: {
						parentId: "Cannot set category as its own parent",
					},
				});
			}

			if (data.parentId !== null) {
				const parentCategory = await db.query.moneyCategories.findFirst(
					{
						where: and(
							eq(moneyCategories.id, data.parentId),
							eq(moneyCategories.userId, uid),
						),
					},
				);

				if (!parentCategory) {
					throw badRequest({
						message: "Parent category not found",
						formErrors: {
							parentId: "Parent category not found",
						},
					});
				}

				// Parent category must be the same type
				if (parentCategory.type !== existingCategory.type) {
					throw badRequest({
						message: "Parent category type must match",
						formErrors: {
							parentId: "Parent category must be the same type",
						},
					});
				}

				// Parent cannot have a parent itself (max depth: 2 levels)
				if (parentCategory.parentId) {
					throw badRequest({
						message: "Cannot create nested subcategory",
						formErrors: {
							parentId:
								"Parent category is already a subcategory. Maximum depth is 2 levels.",
						},
					});
				}

				// Check if current category has children (would create depth > 2)
				const hasChildren = await db.query.moneyCategories.findFirst({
					where: and(
						eq(moneyCategories.parentId, id),
						eq(moneyCategories.userId, uid),
					),
				});

				if (hasChildren) {
					throw badRequest({
						message:
							"Cannot set parent for category that has children",
						formErrors: {
							parentId:
								"This category has children. Setting a parent would exceed maximum depth.",
						},
					});
				}
			}
		}

		// Build update object
		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.icon !== undefined) updateData.icon = data.icon;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.parentId !== undefined) updateData.parentId = data.parentId;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;

		const [updatedCategory] = await db
			.update(moneyCategories)
			.set(updateData)
			.where(eq(moneyCategories.id, id))
			.returning();

		return c.json({ data: updatedCategory });
	});

export default putCategoryRoute;
