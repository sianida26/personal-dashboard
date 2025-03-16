import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { Hono } from "hono";

import {
	paginationRequestSchema,
	userFormSchema,
	userUpdateSchema,
} from "@repo/validation";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import db from "../../drizzle";
import { rolesSchema } from "../../drizzle/schema/roles";
import { rolesToUsers } from "../../drizzle/schema/rolesToUsers";
import { users } from "../../drizzle/schema/users";
import DashboardError from "../../errors/DashboardError";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import type HonoEnv from "../../types/HonoEnv";
import { hashPassword } from "../../utils/passwordUtils";
import requestValidator from "../../utils/requestValidator";

const usersRoute = new Hono<HonoEnv>()
	.use(authInfo)
	/**
	 * Get All Users With Metadata
	 *
	 * This endpoint retrieves a paginated list of users along with pagination metadata.
	 * Query parameters:
	 * - includeTrashed: boolean (default false) - include soft-deleted users if true.
	 * - q: string - search query to filter users by name, username, email or id.
	 * - page: number - current page.
	 * - limit: number - records per page.
	 */
	.get(
		"/",
		checkPermission("users.readAll"),
		requestValidator("query", paginationRequestSchema),
		async (c) => {
			const { includeTrashed, page, limit, q } = c.req.valid("query");

			// Build where clause based on query parameters
			const whereClause = and(
				includeTrashed ? undefined : isNull(users.deletedAt),
				q
					? or(
							ilike(users.name, q),
							ilike(users.username, q),
							ilike(users.email, q),
							eq(users.id, q),
						)
					: undefined,
			);

			// Create a computed subquery for total count of users
			const totalCountQuery = includeTrashed
				? sql<number>`(SELECT count(*) FROM ${users})`
				: sql<number>`(SELECT count(*) FROM ${users} WHERE ${users.deletedAt} IS NULL)`;

			// Calculate pagination offset
			const offset = (page - 1) * limit;

			// Execute the query using db.query.users.findMany
			const result = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					username: true,
					isEnabled: true,
					createdAt: true,
					updatedAt: true,
					...(includeTrashed ? { deletedAt: true } : {}),
				},
				where: whereClause,
				extras: {
					fullCount: totalCountQuery.as("fullCount"),
				},
				with: {
					rolesToUsers: {
						with: {
							role: {
								columns: {
									id: true,
									name: true,
									code: true,
								},
							},
						},
					},
				},
				orderBy: [desc(users.createdAt)],
				offset: offset,
				limit: limit,
			});

			// Remove the computed fullCount from each record and extract metadata
			const data = result.map(({ fullCount, rolesToUsers, ...rest }) => {
				return {
					...rest,
					roles: rolesToUsers.map((role) => role.role),
				};
			});
			const totalItems = Number(result[0]?.fullCount) || 0;
			const totalPages = Math.ceil(totalItems / limit);

			return c.json({
				data,
				_metadata: {
					currentPage: page,
					totalPages,
					totalItems,
					perPage: limit,
				},
			});
		},
	)
	//get user by id
	.get(
		"/:id",
		checkPermission("users.readAll"),
		requestValidator(
			"query",
			z.object({
				includeTrashed: z.string().default("false"),
			}),
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
						!includeTrashed ? isNull(users.deletedAt) : undefined,
					),
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
		},
	)
	//create user
	.post(
		"/",
		checkPermission("users.create"),
		requestValidator("json", userFormSchema),
		async (c) => {
			const userData = c.req.valid("json");

			//check for existing username
			const sameUsername = await db.query.users.findFirst({
				where: eq(users.username, userData.username),
			});

			if (sameUsername) {
				throw new DashboardError({
					errorCode: "INVALID_FORM_DATA",
					message: "Username is already exists",
					formErrors: {
						username: "This username is already exists",
					},
					severity: "LOW",
					statusCode: 422,
				});
			}

			if (userData.email) {
				const sameEmail = await db.query.users.findFirst({
					where: eq(users.email, userData.email),
				});

				if (sameEmail)
					throw new DashboardError({
						errorCode: "INVALID_FORM_DATA",
						message: "Email is already exists",
						formErrors: {
							username: "This email is already exists",
						},
						severity: "LOW",
						statusCode: 422,
					});
			}

			await db.transaction(async (trx) => {
				const [user] = await trx
					.insert(users)
					.values({
						name: userData.name,
						username: userData.username,
						email: userData.email,
						password: await hashPassword(userData.password),
						isEnabled: userData.isEnabled,
					})
					.returning();

				if (!user) {
					throw new DashboardError({
						errorCode: "INTERNAL_SERVER_ERROR",
						message: "Failed to create user",
						severity: "HIGH",
						statusCode: 500,
					});
				}

				if (userData.roles) {
					const roles = userData.roles;

					if (roles?.length) {
						await trx.insert(rolesToUsers).values(
							roles.map((role) => ({
								userId: user.id,
								roleId: role,
							})),
						);
					}
				}
			});

			return c.json(
				{
					message: "User created successfully",
				},
				201,
			);
		},
	)

	//update user
	.patch(
		"/:id",
		checkPermission("users.update"),
		requestValidator("json", userUpdateSchema),
		async (c) => {
			const userId = c.req.param("id");
			const userData = c.req.valid("json");

			const user = await db
				.select()
				.from(users)
				.where(and(eq(users.id, userId), isNull(users.deletedAt)));

			if (!user[0]) return c.notFound();

			await db.transaction(async (trx) => {
				await trx
					.update(users)
					.set({
						...userData,
						...(userData.password
							? {
									password: await hashPassword(
										userData.password,
									),
								}
							: {}),
						updatedAt: new Date(),
						isEnabled: userData.isEnabled,
					})
					.where(eq(users.id, userId));

				// re sync roles
				if (userData.roles) {
					await trx
						.delete(rolesToUsers)
						.where(eq(rolesToUsers.userId, userId));
					await trx.insert(rolesToUsers).values(
						userData.roles.map((role) => ({
							userId,
							roleId: role,
						})),
					);
				}
			});

			return c.json({
				message: "User updated successfully",
			});
		},
	)

	//delete user
	.delete(
		"/:id",
		checkPermission("users.delete"),
		requestValidator(
			"form",
			z.object({
				skipTrash: z.string().default("false"),
			}),
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
						skipTrash ? undefined : isNull(users.deletedAt),
					),
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
		},
	)

	//undo delete
	.patch("/restore/:id", checkPermission("users.restore"), async (c) => {
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
