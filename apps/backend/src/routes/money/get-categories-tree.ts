import { eq, sql } from "drizzle-orm";
import db from "../../drizzle";
import { moneyCategories } from "../../drizzle/schema/moneyCategories";
import { unauthorized } from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import { createHonoRoute } from "../../utils/createHonoRoute";

interface CategoryTreeNode {
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
	children: CategoryTreeNode[];
}

/**
 * GET /money/categories/tree - Get all categories for the user in tree structure
 */
const getCategoriesTreeRoute = createHonoRoute()
	.use(authInfo)
	.get("/tree", async (c) => {
		const uid = c.get("uid");
		if (!uid) throw unauthorized();

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
			.where(eq(moneyCategories.userId, uid));

		const buildTree = (type: "income" | "expense"): CategoryTreeNode[] => {
			const filtered = categories.filter((cat) => cat.type === type);
			const categoryMap = new Map<string, CategoryTreeNode>();
			const rootCategories: CategoryTreeNode[] = [];

			// First pass: create map
			for (const cat of filtered) {
				categoryMap.set(cat.id, {
					id: cat.id,
					userId: cat.userId,
					name: cat.name,
					type: cat.type,
					icon: cat.icon,
					color: cat.color,
					parentId: cat.parentId,
					isActive: cat.isActive,
					createdAt: cat.createdAt,
					updatedAt: cat.updatedAt,
					transactionCount: Number(cat.transactionCount),
					children: [],
				});
			}

			// Second pass: build tree
			for (const cat of filtered) {
				const category = categoryMap.get(cat.id);
				if (!category) continue;

				if (cat.parentId && categoryMap.has(cat.parentId)) {
					categoryMap.get(cat.parentId)?.children.push(category);
				} else {
					rootCategories.push(category);
				}
			}

			return rootCategories;
		};

		const response = {
			income: buildTree("income"),
			expense: buildTree("expense"),
		};

		return c.json({ data: response });
	});

export default getCategoriesTreeRoute;
