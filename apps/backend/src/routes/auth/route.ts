import { zValidator } from "@hono/zod-validator";
import type { PermissionCode } from "@repo/data";
import { loginSchema } from "@repo/validation";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { Hono } from "hono";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import DashboardError, {
	notFound,
	unauthorized,
} from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import type HonoEnv from "../../types/HonoEnv";
import { generateAccessToken } from "../../utils/authUtils";
import { checkPassword } from "../../utils/passwordUtils";

const authRoutes = new Hono<HonoEnv>()
	.post("/login", zValidator("json", loginSchema), async (c) => {
		const formData = c.req.valid("json");

		// Query the database to find the user by username or email, only if the user is enabled and not deleted
		const user = await db.query.users.findFirst({
			where: and(
				isNull(users.deletedAt),
				eq(users.isEnabled, true),
				or(
					eq(users.username, formData.username),
					and(
						eq(users.email, formData.username),
						ne(users.email, ""),
					),
				),
			),
			with: {
				permissionsToUsers: {
					with: {
						permission: true,
					},
				},
				rolesToUsers: {
					with: {
						role: {
							with: {
								permissionsToRoles: {
									with: {
										permission: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!user) {
			throw new DashboardError({
				errorCode: "INVALID_CREDENTIALS",
				message: "Invalid username or password",
				severity: "LOW",
				statusCode: 400,
			});
		}

		const isSuccess = await checkPassword(formData.password, user.password);

		if (!isSuccess) {
			throw new DashboardError({
				errorCode: "INVALID_CREDENTIALS",
				message: "Invalid username or password",
				severity: "LOW",
				statusCode: 400,
			});
		}

		const accessToken = await generateAccessToken({
			uid: user.id,
		});

		// Collect all permissions the user has, both user-specific and role-specific
		const permissions = new Set<PermissionCode>();

		// Add user-specific permissions to the set
		for (const userPermission of user.permissionsToUsers) {
			permissions.add(userPermission.permission.code as PermissionCode);
		}

		// Add role-specific permissions to the set
		for (const userRole of user.rolesToUsers) {
			for (const rolePermission of userRole.role.permissionsToRoles) {
				permissions.add(
					rolePermission.permission.code as PermissionCode,
				);
			}
		}

		return c.json({
			accessToken,
			user: {
				id: user.id,
				name: user.name,
				permissions: Array.from(permissions),
				roles: user.rolesToUsers.map((role) => role.role.name),
			},
		});
	})
	.get("/my-profile", authInfo, async (c) => {
		const currentUser = c.var.currentUser;

		if (!currentUser || !c.var.uid) {
			throw unauthorized();
		}

		return c.json({ ...currentUser, id: c.var.uid });
	})
	.get("/logout", (c) => {
		const uid = c.var.uid;

		if (!uid) {
			throw notFound();
		}

		return c.json({
			message: "Logged out successfully",
		});
	});

export default authRoutes;
