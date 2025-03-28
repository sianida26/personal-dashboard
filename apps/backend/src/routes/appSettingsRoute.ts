import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type HonoEnv from "../types/HonoEnv";
import db from "../drizzle";
import { asc, eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { notFound } from "../errors/DashboardError";
import {
	appSettingUpdateSchema,
	paginationRequestSchema,
} from "@repo/validation";
import checkPermission from "../middlewares/checkPermission";
import { appSettingsSchema } from "../drizzle/schema/appSettingsSchema";
import { appSettings } from "@repo/data";
import requestValidator from "../utils/requestValidator";
import authInfo from "../middlewares/authInfo";

// Create a router for app settings
const appSettingsRouter = new Hono<HonoEnv>()
	.use(authInfo)
	//get all app settings
	.get(
		"/",
		checkPermission("app-settings.read"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const {
				page,
				limit,
				q,
				sort,
				filter: filterParams,
			} = c.req.valid("query");

			// Build where clause based on query parameters
			const whereConditions = [];

			// Add global search condition
			if (q) {
				whereConditions.push(
					or(
						ilike(appSettingsSchema.key, `%${q}%`),
						ilike(appSettingsSchema.value, `%${q}%`),
						eq(appSettingsSchema.id, q),
					),
				);
			}

			// Add filter conditions
			if (filterParams) {
				for (const filter of filterParams) {
					switch (filter.id) {
						case "key":
							if (typeof filter.value === "string") {
								whereConditions.push(
									ilike(
										appSettingsSchema.key,
										`%${filter.value}%`,
									),
								);
							}
							break;
						case "value":
							if (typeof filter.value === "string") {
								whereConditions.push(
									ilike(
										appSettingsSchema.value,
										`%${filter.value}%`,
									),
								);
							}
							break;
					}
				}
			}

			// Combine all where conditions
			const whereClause =
				whereConditions.length > 0
					? and(...whereConditions)
					: undefined;

			// Calculate pagination offset
			const offset = (page - 1) * limit;

			// Determine the orderBy configuration based on sorting parameters
			const orderByConfig = [];

			if (sort?.length) {
				for (const sortParam of sort) {
					switch (sortParam.id) {
						case "key":
							orderByConfig.push(
								sortParam.desc
									? desc(appSettingsSchema.key)
									: asc(appSettingsSchema.key),
							);
							break;
						case "value":
							orderByConfig.push(
								sortParam.desc
									? desc(appSettingsSchema.value)
									: asc(appSettingsSchema.value),
							);
							break;
						case "createdAt":
							orderByConfig.push(
								sortParam.desc
									? desc(appSettingsSchema.createdAt)
									: asc(appSettingsSchema.createdAt),
							);
							break;
						case "updatedAt":
							orderByConfig.push(
								sortParam.desc
									? desc(appSettingsSchema.updatedAt)
									: asc(appSettingsSchema.updatedAt),
							);
							break;
					}
				}
			}

			// Add default sorting if no valid sort parameters
			if (orderByConfig.length === 0) {
				orderByConfig.push(asc(appSettingsSchema.key));
			}

			// Execute the query with all configurations
			const result = await db.query.appSettingsSchema.findMany({
				where: whereClause,
				orderBy: orderByConfig,
				offset: offset,
				limit: limit,
			});

			// Get total count for pagination
			const totalCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(appSettingsSchema)
				.where(whereClause);

			const totalItems = Number(totalCount[0]?.count) || 0;
			const totalPages = Math.ceil(totalItems / limit);

			return c.json({
				data: result.map((setting) => ({
					...setting,
					value: appSettings.find((s) => s.key === setting.key)
						?.secret
						? "********"
						: setting.value,
				})),
				_metadata: {
					currentPage: page,
					totalPages,
					totalItems,
					perPage: limit,
				},
			});
		},
	)
	//get a single app setting
	.get("/:id", checkPermission("app-settings.read"), async (c) => {
		const id = c.req.param("id");
		const setting = await db.query.appSettingsSchema.findFirst({
			where: eq(appSettingsSchema.id, id),
		});

		if (!setting) {
			throw notFound({
				message: `Setting with id ${id} not found`,
			});
		}

		return c.json(setting);
	})
	//get all app setting keys
	.get("/keys", checkPermission("app-settings.read"), async (c) => {
		// Return all available setting keys
		return c.json({
			keys: appSettings.map((setting) => setting.key),
			defaultValues: appSettings.map((setting) => setting.defaultValue),
		});
	})
	//update a single app setting
	.put(
		"/:id",
		checkPermission("app-settings.edit"),
		zValidator("json", appSettingUpdateSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");

			// Check if setting exists
			const existingSetting = await db.query.appSettingsSchema.findFirst({
				where: eq(appSettingsSchema.id, id),
			});

			if (!existingSetting) {
				throw notFound({
					message: `Setting with id ${id} not found`,
				});
			}

			const result = await db
				.update(appSettingsSchema)
				.set({ value: data.value, updatedAt: new Date() })
				.where(eq(appSettingsSchema.id, id))
				.returning();

			return c.json(result[0]);
		},
	);

export default appSettingsRouter;
