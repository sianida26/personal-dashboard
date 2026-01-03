import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import deleteCategoryRoute from "./delete-category";
import deleteTransactionRoute from "./delete-transaction";
import getAnalyticsRoute from "./get-analytics";
import getCategoriesRoute from "./get-categories";
import getCategoriesTreeRoute from "./get-categories-tree";
import getTransactionByIdRoute from "./get-transaction-by-id";
import getTransactionsRoute from "./get-transactions";
import getTransactionsExportRoute from "./get-transactions-export";
import postCategoryRoute from "./post-category";
import postTransactionRoute from "./post-transaction";
import putCategoryRoute from "./put-category";
import putTransactionRoute from "./put-transaction";

const moneyRoute = new Hono<HonoEnv>()
	// Analytics routes
	.route("/analytics", getAnalyticsRoute)
	// Category routes
	.route("/categories", getCategoriesTreeRoute) // Must come before getCategoriesRoute due to /tree path
	.route("/categories", getCategoriesRoute)
	.route("/categories", postCategoryRoute)
	.route("/categories", putCategoryRoute)
	.route("/categories", deleteCategoryRoute)
	// Transaction routes
	.route("/transactions", getTransactionsExportRoute) // Must come before getTransactionsRoute due to /export path
	.route("/transactions", getTransactionsRoute)
	.route("/transactions", postTransactionRoute)
	.route("/transactions", getTransactionByIdRoute)
	.route("/transactions", putTransactionRoute)
	.route("/transactions", deleteTransactionRoute);

export default moneyRoute;
