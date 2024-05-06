import { zValidator } from "@hono/zod-validator";
import { and, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie } from "hono/cookie";
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

			const user = (
				await db
					.select({
						id: users.id,
						username: users.username,
						email: users.email,
						password: users.password,
					})
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
			)[0];

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

			const refreshToken = await generateRefreshToken({
				uid: user.id,
			});

			const cookieSecret = process.env.COOKIE_SECRET;

			if (!cookieSecret)
				throw new HTTPException(500, {
					message: "The 'COOKIE_SECRET' env var is not set",
				});

			// await setSignedCookie(
			// 	c,
			// 	"access_token",
			// 	accessToken,
			// 	cookieSecret,
			// 	{
			// 		secure: true,
			// 		httpOnly: true,
			// 		prefix: "secure",
			// 		expires:
			// 	}
			// );

			return c.json({
				accessToken,
				refreshToken,
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
	.get("/my-profile", async (c) => {
		const uid = c.var.uid;

		if (!uid) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		const user = await db
			.select({
				id: users.id,
				username: users.username,
				email: users.email,
				roles: rolesSchema.code,
			})
			.from(rolesToUsers)
			.innerJoin(users, eq(users.id, rolesToUsers.userId))
			.innerJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
			.where(eq(users.id, uid))
			.then((userData) => {
				return userData.reduce(
					(prev, curr) => ({
						...prev,
						roles: [...prev.roles, curr.roles],
					}),
					{
						id: uid,
						username: userData[0].username,
						email: userData[0].email,
						roles: [] as string[],
					}
				);
			});

		if (!user) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}

		return c.json(user);
	})
	.get("/logout", (c) => {
		const uid = c.var.uid;

		if (!uid) {
			return c.notFound();
		}

		deleteCookie(c, "access_token", {
			secure: true,
			httpOnly: true,
			prefix: "secure",
		});

		return c.json({
			message: "Logged out successfully",
		});
	});

export default authRoutes;
