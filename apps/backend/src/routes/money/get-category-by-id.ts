import { and, eq } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { notFound, unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";

/**
 * GET /money/categories/:id - Get a single category by ID
 */
const getCategoryByIdRoute = createHonoRoute()
	.use(authInfo)
	.get("/:id", async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const categoryId = c.req.param("id");

		const [category] = await db
			.select({
				id: moneyCategories.id,
				userId: moneyCategories.userId,
				name: moneyCategories.name,
				type: moneyCategories.type,
				icon: moneyCategories.icon,
				color: moneyCategories.color,
				parentId: moneyCategories.parentId,
				isActive: moneyCategories.isActive,
				createdAt: moneyCategories.createdAt,
				updatedAt: moneyCategories.updatedAt,
			})
			.from(moneyCategories)
			.where(
				and(
					eq(moneyCategories.id, categoryId),
					eq(moneyCategories.userId, uid),
				),
			);

		if (!category) {
			throw notFound({ message: "Category not found" });
		}

		return c.json({ data: category });
	});

export default getCategoryByIdRoute;
