import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type HonoEnv from "../types/HonoEnv";
import db from "../drizzle";
import { appSettings } from "../drizzle/schema/appSettingsSchema";
import { eq } from "drizzle-orm";
import { notFound } from "../errors/DashboardError";
import {
	appSettingCreateSchema,
	appSettingUpdateSchema,
} from "@repo/validation";
import type { PaginatedResponse } from "@repo/data/types";
import checkPermission from "../middlewares/checkPermission";

// Create a router for app settings
const appSettingsRouter = new Hono<HonoEnv>()
	.get("/", async (c) => {
		const { page = "1", limit = "10", q = "", sort } = c.req.query();

		const currentPage = Number.parseInt(page, 10);
		const perPage = Number.parseInt(limit, 10);

		// Get all settings first
		const settings = await db
			.select()
			.from(appSettings)
			.orderBy(appSettings.key);

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
		const setting = await db.query.appSettings.findFirst({
			where: eq(appSettings.id, id),
		});

		if (!setting) {
			throw notFound({
				message: `Setting with id ${id} not found`,
			});
		}

		return c.json(setting);
	})
	.post(
		"/",
		checkPermission("APP_SETTINGS_MANAGE"),
		zValidator("json", appSettingCreateSchema),
		async (c) => {
			const data = c.req.valid("json");

			// Check if key already exists
			const existingSetting = await db.query.appSettings.findFirst({
				where: eq(appSettings.key, data.key),
			});

			if (existingSetting) {
				return c.json({ error: "Key already exists" }, 400);
			}

			const result = await db
				.insert(appSettings)
				.values(data)
				.returning();
			return c.json(result[0]);
		},
	)
	.put(
		"/:id",
		checkPermission("APP_SETTINGS_MANAGE"),
		zValidator("json", appSettingUpdateSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");

			// Check if setting exists
			const existingSetting = await db.query.appSettings.findFirst({
				where: eq(appSettings.id, id),
			});

			if (!existingSetting) {
				throw notFound({
					message: `Setting with id ${id} not found`,
				});
			}

			// Check if updated key would conflict with another setting
			if (data.key !== existingSetting.key) {
				const keyConflict = await db.query.appSettings.findFirst({
					where: eq(appSettings.key, data.key),
				});

				if (keyConflict) {
					return c.json({ error: "Key already exists" }, 400);
				}
			}

			const result = await db
				.update(appSettings)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(appSettings.id, id))
				.returning();

			return c.json(result[0]);
		},
	)
	.delete("/:id", checkPermission("APP_SETTINGS_MANAGE"), async (c) => {
		const id = c.req.param("id");

		// Check if setting exists
		const existingSetting = await db.query.appSettings.findFirst({
			where: eq(appSettings.id, id),
		});

		if (!existingSetting) {
			throw notFound({
				message: `Setting with id ${id} not found`,
			});
		}

		await db.delete(appSettings).where(eq(appSettings.id, id));
		return c.json({ success: true });
	});

export default appSettingsRouter; 