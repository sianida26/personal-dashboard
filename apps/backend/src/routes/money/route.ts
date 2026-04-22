import { Hono } from "hono";
import type HonoEnv from "../../types/HonoEnv";
import deleteAccountRoute from "./delete-account";
import deleteCategoryRoute from "./delete-category";
import deleteTransactionRoute from "./delete-transaction";
import getAccountByIdRoute from "./get-account-by-id";
import getAccountsRoute from "./get-accounts";
import getAnalyticsRoute from "./get-analytics";
import getCategoriesRoute from "./get-categories";
import getCategoriesTreeRoute from "./get-categories-tree";
import getCategoryByIdRoute from "./get-category-by-id";
import getTransactionByIdRoute from "./get-transaction-by-id";
import getTransactionLabelsRoute from "./get-transaction-labels";
import getTransactionsRoute from "./get-transactions";
import getTransactionsExportRoute from "./get-transactions-export";
import postAccountRoute from "./post-account";
import postAccountReconcileRoute from "./post-account-reconcile";
import postCategoryRoute from "./post-category";
import postTransactionRoute from "./post-transaction";
import putAccountRoute from "./put-account";
import putCategoryRoute from "./put-category";
import putTransactionRoute from "./put-transaction";

const moneyRoute = new Hono<HonoEnv>()
	// Analytics routes
	.route("/analytics", getAnalyticsRoute)
	// Account routes
	.route("/accounts", getAccountsRoute)
	.route("/accounts", postAccountRoute)
	.route("/accounts", postAccountReconcileRoute)
	.route("/accounts", getAccountByIdRoute) // Must come before putAccountRoute due to :id path matching
	.route("/accounts", putAccountRoute)
	.route("/accounts", deleteAccountRoute)
	// Category routes
	.route("/categories", getCategoriesTreeRoute) // Must come before getCategoriesRoute due to /tree path
	.route("/categories", getCategoriesRoute)
	.route("/categories", postCategoryRoute)
	.route("/categories", getCategoryByIdRoute) // Must come before putCategoryRoute due to :id path matching
	.route("/categories", putCategoryRoute)
	.route("/categories", deleteCategoryRoute)
	// Transaction routes
	.route("/transactions/labels", getTransactionLabelsRoute) // Must come before other transaction routes
	.route("/transactions", getTransactionsExportRoute) // Must come before getTransactionsRoute due to /export path
	.route("/transactions", getTransactionsRoute)
	.route("/transactions", postTransactionRoute)
	.route("/transactions", getTransactionByIdRoute)
	.route("/transactions", putTransactionRoute)
	.route("/transactions", deleteTransactionRoute);

export default moneyRoute;
