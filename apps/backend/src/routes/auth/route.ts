import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { checkPassword } from "../../utils/passwordUtils";
import { generateAccessToken } from "../../utils/authUtils";
import HonoEnv from "../../types/HonoEnv";
import { SpecificPermissionCode } from "../../data/permissions";
import authInfo from "../../middlewares/authInfo";
import { notFound, unauthorized } from "../../errors/DashboardError";

const authRoutes = new Hono<HonoEnv>()
	.post(
		"/login",
		zValidator(
			"json",
			z.object({
				username: z.string(),
				password: z.string(),
			})
		),
		async (c) => {
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
							ne(users.email, "")
						)
					)
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
				throw new HTTPException(400, {
					message: "Invalid username or password",
				});
			}

			const isSuccess = await checkPassword(
				formData.password,
				user.password
			);

			if (!isSuccess) {
				throw new HTTPException(400, {
					message: "Invalid username or password",
				});
			}

			const accessToken = await generateAccessToken({
				uid: user.id,
			});

			// Collect all permissions the user has, both user-specific and role-specific
			const permissions = new Set<SpecificPermissionCode>();

			// Add user-specific permissions to the set
			user.permissionsToUsers.forEach((userPermission) =>
				permissions.add(
					userPermission.permission.code as SpecificPermissionCode
				)
			);

			// Add role-specific permissions to the set
			user.rolesToUsers.forEach((userRole) =>
				userRole.role.permissionsToRoles.forEach((rolePermission) =>
					permissions.add(
						rolePermission.permission.code as SpecificPermissionCode
					)
				)
			);

			return c.json({
				accessToken,
				user: {
					id: user.id,
					name: user.name,
					permissions: Array.from(permissions),
				},
			});
		}
	)
	.get("/my-profile", authInfo, async (c) => {
		const currentUser = c.var.currentUser;

		if (!currentUser) {
			throw unauthorized();
		}

		return c.json({ ...currentUser, id: c.var.uid! });
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
