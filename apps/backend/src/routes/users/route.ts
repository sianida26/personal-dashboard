import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";

import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { hashPassword } from "../../utils/passwordUtils";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { rolesSchema } from "../../drizzle/schema/roles";
import HonoEnv from "../../types/HonoEnv";
import requestValidator from "../../utils/requestValidator";

const userFormSchema = z.object({
	name: z.string().min(1).max(255),
	username: z.string().min(1).max(255),
	email: z.string().email().optional().or(z.literal("")),
	password: z.string().min(6),
	isEnabled: z.string().default("false"),
	roles: z
		.string()
		.refine(
			(data) => {
				console.log(data);
				try {
					const parsed = JSON.parse(data);
					return Array.isArray(parsed);
				} catch {
					return false;
				}
			},
			{
				message: "Roles must be an array",
			}
		)
		.optional(),
});

const userUpdateSchema = userFormSchema.extend({
	password: z.string().min(6).optional().or(z.literal("")),
});

const usersRoute = new Hono<HonoEnv>()
	.use(async (c, next) => {
		const uid = c.get("uid");

		if (uid) {
			await next();
		} else {
			throw new HTTPException(401, {
				message: "Unauthorized",
			});
		}
	})
	.get(
		"/",
		requestValidator(
			"query",
			z.object({
				includeTrashed: z.string().default("false"),
			})
		),
		async (c) => {
			const includeTrashed =
				c.req.query("includeTrashed")?.toLowerCase() === "true";

			let usersData = await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					isEnabled: users.isEnabled,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
					...(includeTrashed ? { deletedAt: users.deletedAt } : {}),

					// password: users.password,
				})
				.from(users)
				.where(!includeTrashed ? isNull(users.deletedAt) : undefined);

			return c.json(usersData);
		}
	)
	//get user by id
	.get(
		"/:id",
		requestValidator(
			"query",
			z.object({
				includeTrashed: z.string().default("false"),
			})
		),
		async (c) => {
			const userId = c.req.param("id");

			const includeTrashed =
				c.req.query("includeTrashed")?.toLowerCase() === "true";

			const queryResult = await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					username: users.username,
					isEnabled: users.isEnabled,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
					...(includeTrashed ? { deletedAt: users.deletedAt } : {}),
					role: {
						name: rolesSchema.name,
						id: rolesSchema.id,
					},
				})
				.from(users)
				.leftJoin(rolesToUsers, eq(users.id, rolesToUsers.userId))
				.leftJoin(rolesSchema, eq(rolesToUsers.roleId, rolesSchema.id))
				.where(
					and(
						eq(users.id, userId),
						!includeTrashed ? isNull(users.deletedAt) : undefined
					)
				);

			if (!queryResult.length)
				throw new HTTPException(404, {
					message: "The user does not exists",
				});

			const roles = queryResult.reduce((prev, curr) => {
				if (!curr.role) return prev;
				prev.set(curr.role.id, curr.role.name);
				return prev;
			}, new Map<string, string>()); //Map<id, name>

			const userData = {
				...queryResult[0],
				role: undefined,
				roles: Array.from(roles, ([id, name]) => ({ id, name })),
			};

			return c.json(userData);
		}
	)
	//create user
	.post("/", requestValidator("form", userFormSchema), async (c) => {
		const userData = c.req.valid("form");

		const user = await db
			.insert(users)
			.values({
				name: userData.name,
				username: userData.username,
				email: userData.email,
				password: await hashPassword(userData.password),
				isEnabled: userData.isEnabled.toLowerCase() === "true",
			})
			.returning();

		if (userData.roles) {
			const roles = JSON.parse(userData.roles) as string[];
			console.log(roles);

			if (roles.length) {
				await db.insert(rolesToUsers).values(
					roles.map((role) => ({
						userId: user[0].id,
						roleId: role,
					}))
				);
			}
		}

		return c.json(
			{
				message: "User created successfully",
			},
			201
		);
	})

	//update user
	.patch("/:id", requestValidator("form", userUpdateSchema), async (c) => {
		const userId = c.req.param("id");
		const userData = c.req.valid("form");

		const user = await db
			.select()
			.from(users)
			.where(and(eq(users.id, userId), isNull(users.deletedAt)));

		if (!user[0]) return c.notFound();

		await db
			.update(users)
			.set({
				...userData,
				...(userData.password
					? { password: await hashPassword(userData.password) }
					: {}),
				updatedAt: new Date(),
				isEnabled: userData.isEnabled.toLowerCase() === "true",
			})
			.where(eq(users.id, userId));

		return c.json({
			message: "User updated successfully",
		});
	})

	//delete user
	.delete(
		"/:id",
		requestValidator(
			"form",
			z.object({
				skipTrash: z.string().default("false"),
			})
		),
		async (c) => {
			const userId = c.req.param("id");
			const currentUserId = c.var.uid;

			const skipTrash =
				c.req.valid("form").skipTrash.toLowerCase() === "true";

			const user = await db
				.select()
				.from(users)
				.where(
					and(
						eq(users.id, userId),
						skipTrash ? undefined : isNull(users.deletedAt)
					)
				);

			if (!user[0])
				throw new HTTPException(404, {
					message: "The user is not found",
				});

			if (user[0].id === currentUserId) {
				throw new HTTPException(400, {
					message: "You cannot delete yourself",
				});
			}

			if (skipTrash) {
				await db.delete(users).where(eq(users.id, userId));
			} else {
				await db
					.update(users)
					.set({
						deletedAt: new Date(),
					})
					.where(and(eq(users.id, userId), isNull(users.deletedAt)));
			}
			return c.json({
				message: "User deleted successfully",
			});
		}
	)

	//undo delete
	.patch("/restore/:id", async (c) => {
		const userId = c.req.param("id");

		const user = (
			await db.select().from(users).where(eq(users.id, userId))
		)[0];

		if (!user) return c.notFound();

		if (!user.deletedAt) {
			throw new HTTPException(400, {
				message: "The user is not deleted",
			});
		}

		await db
			.update(users)
			.set({ deletedAt: null })
			.where(eq(users.id, userId));

		return c.json({
			message: "User restored successfully",
		});
	});

export default usersRoute;
