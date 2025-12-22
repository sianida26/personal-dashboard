import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	themePreferenceSchema,
	updateThemePreferenceSchema,
} from "@repo/validation";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import type HonoEnv from "../../types/HonoEnv";

const themeRoute = new Hono<HonoEnv>().use(authInfo);

/**
 * GET /api/users/me/theme
 * Get current user's theme preferences
 *
 * @returns Theme preference object
 */
themeRoute.get("/me/theme", async (c) => {
	const uid = c.get("uid");

	if (!uid) {
		throw new DashboardError({
			message: "Unauthorized",
			statusCode: 401,
			severity: "LOW",
			errorCode: "UNAUTHORIZED",
		});
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, uid),
		columns: {
			themeMode: true,
			colorScheme: true,
		},
	});

	if (!user) {
		throw new DashboardError({
			message: "User not found",
			statusCode: 404,
			severity: "LOW",
			errorCode: "USER_NOT_FOUND",
		});
	}

	const themePreference = themePreferenceSchema.parse({
		themeMode: user.themeMode || "light",
		colorScheme: user.colorScheme || "default",
	});

	return c.json(themePreference);
});

/**
 * PATCH /api/users/me/theme
 * Update current user's theme preferences
 *
 * @body themeMode - Optional theme mode (light, dark, system)
 * @body colorScheme - Optional color scheme (default, blue, purple, green, orange, red)
 * @returns Updated theme preference
 */
themeRoute.patch(
	"/me/theme",
	zValidator("json", updateThemePreferenceSchema),
	async (c) => {
		const uid = c.get("uid");
		const body = c.req.valid("json");

		if (!uid) {
			throw new DashboardError({
				message: "Unauthorized",
				statusCode: 401,
				severity: "LOW",
				errorCode: "UNAUTHORIZED",
			});
		}

		// Build update object only with provided fields
		const updateData: {
			themeMode?: string;
			colorScheme?: string;
			updatedAt: Date;
		} = {
			updatedAt: new Date(),
		};

		if (body.themeMode !== undefined) {
			updateData.themeMode = body.themeMode;
		}

		if (body.colorScheme !== undefined) {
			updateData.colorScheme = body.colorScheme;
		}

		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, uid))
			.returning({
				themeMode: users.themeMode,
				colorScheme: users.colorScheme,
			});

		if (!updatedUser) {
			throw new DashboardError({
				message: "Failed to update theme preference",
				statusCode: 500,
				severity: "MEDIUM",
				errorCode: "UPDATE_FAILED",
			});
		}

		const themePreference = themePreferenceSchema.parse({
			themeMode: updatedUser.themeMode || "light",
			colorScheme: updatedUser.colorScheme || "default",
		});

		return c.json(themePreference);
	},
);

export default themeRoute;
