import { categoryQuerySchema } from "@repo/validation";
import { and, eq, sql } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";
import requestValidator from "../../utils/requestValidator";

interface CategoryWithStats {
	id: string;
	userId: string;
	name: string;
	type: "income" | "expense";
	icon: string | null;
	color: string | null;
	parentId: string | null;
	isActive: boolean;
	createdAt: Date | null;
	updatedAt: Date | null;
	transactionCount: number;
	children?: CategoryWithStats[];
}

/**
 * GET /money/categories - Get all categories for the user
 */
const getCategoriesRoute = createHonoRoute()
	.use(authInfo)
	.get("/", requestValidator("query", categoryQuerySchema), async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

		const { type, includeInactive, asTree } = c.req.valid("query");

		// Build where conditions
		const whereConditions = [eq(moneyCategories.userId, uid)];

		if (type) {
			whereConditions.push(eq(moneyCategories.type, type));
		}

		if (!includeInactive) {
			whereConditions.push(eq(moneyCategories.isActive, true));
		}

		// Get categories with transaction count
		const categories = await db
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
				transactionCount: sql<number>`(
					SELECT COUNT(*) 
					FROM "money_transactions" 
					WHERE "money_transactions"."category_id" = "money_categories"."id"
				)`.as("transaction_count"),
			})
			.from(moneyCategories)
			.where(and(...whereConditions));

		if (!asTree) {
			return c.json({ data: categories });
		}

		// Build tree structure
		const categoryMap = new Map<string, CategoryWithStats>();
		const rootCategories: CategoryWithStats[] = [];

		// First pass: create map
		for (const cat of categories) {
			categoryMap.set(cat.id, {
				...cat,
				transactionCount: Number(cat.transactionCount),
				children: [],
			});
		}

		// Second pass: build tree
		for (const cat of categories) {
			const category = categoryMap.get(cat.id);
			if (!category) continue;

			if (cat.parentId && categoryMap.has(cat.parentId)) {
				const parent = categoryMap.get(cat.parentId);
				parent?.children?.push(category);
			}
		}

		return c.json({ data: rootCategories });
	});

export default getCategoriesRoute;
