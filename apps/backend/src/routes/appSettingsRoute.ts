import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type HonoEnv from "../types/HonoEnv";
import db from "../drizzle";
import { eq } from "drizzle-orm";
import { notFound } from "../errors/DashboardError";
import { appSettingUpdateSchema } from "@repo/validation";
import type { PaginatedResponse } from "@repo/data/types";
import checkPermission from "../middlewares/checkPermission";
import { appSettingsSchema } from "../drizzle/schema/appSettingsSchema";
import { appSettings } from "@repo/data";

// Create a router for app settings
const appSettingsRouter = new Hono<HonoEnv>()
	.get("/", async (c) => {
		const { page = "1", limit = "10", q = "", sort } = c.req.query();

		const currentPage = Number.parseInt(page, 10);
		const perPage = Number.parseInt(limit, 10);

		// Get all settings first
		const settings = await db
			.select()
			.from(appSettingsSchema)
			.orderBy(appSettingsSchema.key);

		// Filter by search query if provided
		let filteredSettings = settings;
		if (q) {
			const lowerQ = q.toLowerCase();
			filteredSettings = settings.filter(
				(setting) =>
					setting.key.toLowerCase().includes(lowerQ) ||
					setting.value.toLowerCase().includes(lowerQ),
			);
		}

		// Apply sorting if provided
		if (sort) {
			try {
				const sortOptions = JSON.parse(sort);
				if (Array.isArray(sortOptions) && sortOptions.length > 0) {
					// Simple implementation of sort - this can be enhanced
					const { id, desc } = sortOptions[0];
					filteredSettings = [...filteredSettings].sort((a, b) => {
						const valA = a[id as keyof typeof a];
						const valB = b[id as keyof typeof b];

						if (valA && valB) {
							if (valA < valB) return desc ? 1 : -1;
							if (valA > valB) return desc ? -1 : 1;
						}
						return 0;
					});
				}
			} catch (e) {
				console.error("Error parsing sort parameter:", e);
			}
		}

		// Calculate pagination values
		const totalItems = filteredSettings.length;
		const totalPages = Math.ceil(totalItems / perPage);
		const offset = (currentPage - 1) * perPage;

		// Get the slice of data for the current page
		const paginatedSettings = filteredSettings.slice(
			offset,
			offset + perPage,
		);

		// Return formatted response
		const response: PaginatedResponse<(typeof paginatedSettings)[0]> = {
			data: paginatedSettings,
			_metadata: {
				currentPage,
				totalPages,
				perPage,
				totalItems,
			},
		};

		return c.json(response);
	})
	.get("/:id", async (c) => {
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
	.get("/keys", async (c) => {
		// Return all available setting keys
		return c.json({
			keys: appSettings.map((setting) => setting.key),
			defaultValues: appSettings.map((setting) => setting.defaultValue),
		});
	})
	.put(
		"/:id",
		checkPermission("APP_SETTINGS_MANAGE"),
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
