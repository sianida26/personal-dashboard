import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { checkPassword } from "../../utils/passwordUtils";
import {
	generateAccessToken,
	generateRefreshToken,
	verifyRefreshToken,
} from "../../utils/authUtils";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import HonoEnv from "../../types/HonoEnv";
import { permissionsToUsers } from "../../drizzle/schema/permissionsToUsers";
import { permissionsToRoles } from "../../drizzle/schema/permissionsToRoles";
import { permissionsSchema } from "../../drizzle/schema/permissions";
import { SpecificPermissionCode } from "../../data/permissions";
import authInfo from "../../middlewares/authInfo";
import { unauthorized } from "../../errors/DashboardError";

const authRoutes = new Hono<HonoEnv>()
	.post(
		"/login",
		zValidator(
			"form",
			z.object({
				username: z.string(),
				password: z.string(),
				___jwt: z.string().default("false"),
			})
		),
		async (c) => {
			const formData = c.req.valid("form");

			const user = await db
				.select()
				.from(users)
				.where(
					and(
						isNull(users.deletedAt),
						eq(users.isEnabled, true),
						or(
							eq(users.username, formData.username),
							eq(users.email, formData.username)
						)
					)
				)
				.leftJoin(
					permissionsToUsers,
					eq(permissionsToUsers.userId, users.id)
				)
				.leftJoin(rolesToUsers, eq(rolesToUsers.userId, users.id))
				.leftJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
				.leftJoin(
					permissionsToRoles,
					eq(permissionsToRoles.roleId, rolesSchema.id)
				)
				.leftJoin(
					permissionsSchema,
					or(
						eq(
							permissionsSchema.id,
							permissionsToUsers.permissionId
						),
						eq(
							permissionsSchema.id,
							permissionsToRoles.permissionId
						)
					)
				);

			if (!user.length) {
				throw new HTTPException(400, {
					message: "Invalid username or password",
				});
			}

			const isSuccess = await checkPassword(
				formData.password,
				user[0].users.password
			);

			if (!isSuccess) {
				throw new HTTPException(400, {
					message: "Invalid username or password",
				});
			}

			const accessToken = await generateAccessToken({
				uid: user[0].users.id,
			});

			const refreshToken = await generateRefreshToken({
				uid: user[0].users.id,
			});

			const permissions = new Set<SpecificPermissionCode>();
			user.forEach((user) => {
				if (user.permissions?.code) {
					permissions.add(
						user.permissions.code as SpecificPermissionCode
					);
				}
			});

			return c.json({
				accessToken,
				refreshToken,
				user: {
					id: user[0].users.id,
					name: user[0].users.name,
					permissions: Array.from(permissions),
				},
			});
		}
	)
	.post(
		"/refresh-token",
		zValidator(
			"json",
			z.object({
				refreshToken: z.string(),
			})
		),
		async (c) => {
			const { refreshToken } = c.req.valid("json");

			const decoded = await verifyRefreshToken(refreshToken);

			if (!decoded) {
				throw new HTTPException(401, {
					message: "Invalid refresh token",
				});
			}

			const accessToken = await generateAccessToken({
				uid: decoded.uid,
			});

			return c.json({
				accessToken,
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
			return c.notFound();
		}

		// deleteCookie(c, "access_token", {
		// 	secure: true,
		// 	httpOnly: true,
		// 	prefix: "secure",
		// });

		return c.json({
			message: "Logged out successfully",
		});
	});

export default authRoutes;
