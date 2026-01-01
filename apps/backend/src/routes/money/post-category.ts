import { categoryCreateSchema } from "@repo/validation";
import { and, eq } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { badRequest, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

/**
 * POST /money/categories - Create a new category
 */
const postCategoryRoute = createHonoRoute()
	.use(authInfo)
	.post("/", requestValidator("json", categoryCreateSchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const data = c.req.valid("json");

		// If parentId is provided, validate it
		if (data.parentId) {
			const parentCategory = await db.query.moneyCategories.findFirst({
				where: and(
					eq(moneyCategories.id, data.parentId),
					eq(moneyCategories.userId, uid),
				),
			});

			if (!parentCategory) {
				throw badRequest({
					message: "Parent category not found",
					formErrors: {
						parentId: "Parent category not found",
					},
				});
			}

			// Parent category must be the same type
			if (parentCategory.type !== data.type) {
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
		}

		const [newCategory] = await db
			.insert(moneyCategories)
			.values({
				userId: uid,
				name: data.name,
				type: data.type,
				icon: data.icon,
				color: data.color,
				parentId: data.parentId,
			})
			.returning();

		return c.json({ data: newCategory }, 201);
	});

export default postCategoryRoute;
