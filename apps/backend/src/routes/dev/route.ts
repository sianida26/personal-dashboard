import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { chemicalElements } from "../../data/chemicalElements";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import authInfo from "../../middlewares/authInfo";
import checkPermission from "../../middlewares/checkPermission";
import type HonoEnv from "../../types/HonoEnv";
import requestValidator from "../../utils/requestValidator";

const devRoutes = new Hono<HonoEnv>()
	.use(authInfo)
	.use(checkPermission("dev-routes"))
	.get(
		"/",
		requestValidator(
			"query",
			z.object({
				page: z.coerce.number().int().min(1).default(1),
				limit: z.coerce.number().int().min(1).max(100).default(10),
				q: z.string().optional(),
				sort: z.string().optional(),
				filter: z.string().optional(),
			}),
		),
		async (c) => {
			const { page, limit, q, sort, filter } = c.req.valid("query");

			let filteredData = [...chemicalElements];

			// Apply search filter
			if (q) {
				const searchQuery = q.toLowerCase();
				filteredData = filteredData.filter(
					(element) =>
						element.name.toLowerCase().includes(searchQuery) ||
						element.symbol.toLowerCase().includes(searchQuery) ||
						element.category.toLowerCase().includes(searchQuery) ||
						element.atomicNumber.toString().includes(searchQuery),
				);
			}

			// Apply column filters
			if (filter) {
				const filters = filter.split(",");
				for (const f of filters) {
					const [columnId, value] = f.split(":");
					if (columnId && value) {
						filteredData = filteredData.filter((element) => {
							const elementValue =
								element[columnId as keyof typeof element];
							if (
								elementValue === null ||
								elementValue === undefined
							)
								return false;
							return String(elementValue)
								.toLowerCase()
								.includes(value.toLowerCase());
						});
					}
				}
			}

			// Apply sorting
			if (sort) {
				const sortParams = sort.split(",");
				for (const s of sortParams) {
					const [columnId, direction] = s.split(":");
					if (columnId) {
						filteredData.sort((a, b) => {
							const aValue = a[columnId as keyof typeof a];
							const bValue = b[columnId as keyof typeof b];
							if (aValue === null || aValue === undefined)
								return 1;
							if (bValue === null || bValue === undefined)
								return -1;
							if (aValue < bValue)
								return direction === "desc" ? 1 : -1;
							if (aValue > bValue)
								return direction === "desc" ? -1 : 1;
							return 0;
						});
					}
				}
			}

			const totalItems = filteredData.length;
			const totalPages = Math.ceil(totalItems / limit);
			const startIndex = (page - 1) * limit;
			const paginatedData = filteredData.slice(
				startIndex,
				startIndex + limit,
			);

			return c.json({
				data: paginatedData,
				_metadata: {
					currentPage: page,
					totalPages,
					totalItems,
					perPage: limit,
				},
			});
		},
	)
	.get(
		"/test",
		checkPermission("users.readAll"),
		requestValidator(
			"query",
			z.object({
				includeTrashed: z
					.string()
					.default("false")
					.transform((val) => val === "true"),
				withMetadata: z
					.string()
					.default("false")
					.transform((val) => val === "true"),
				page: z.coerce.number().int().min(1).optional(),
				limit: z.coerce.number().int().min(1).max(1000).optional(),
				q: z.string().optional(),
			}),
		),
		async (c) => {
			const { includeTrashed, page, limit, q, withMetadata } =
				c.req.valid("query");

			const result = await db.query.users.findMany({
				columns: {
					id: true,
					name: true,
					email: true,
					username: true,
					isEnabled: true,
					createdAt: true,
					updatedAt: true,
					deletedAt: includeTrashed,
				},
				extras: {
					fullCount: db
						.$count(
							users,
							includeTrashed
								? isNull(users.deletedAt)
								: undefined,
						)
						.as("fullCount"),
				},
				where: and(
					includeTrashed ? undefined : isNull(users.deletedAt),
					q
						? or(
								ilike(users.name, q),
								ilike(users.username, q),
								ilike(users.email, q),
								eq(users.id, q),
							)
						: undefined,
				),
				offset: page && limit ? page + limit : undefined,
				limit: limit,
			});

			const data = result.map((d) => ({ ...d, fullCount: undefined }));

			if (withMetadata) {
				return c.json({
					data,
					_metadata: {
						currentPage: page ?? 0,
						totalPages:
							page && limit
								? Math.ceil(
										(Number(result[0]?.fullCount) ?? 0) /
											limit,
									)
								: 0,
						totalItems: Number(result[0]?.fullCount) ?? 0,
						perPage: limit ?? 0,
					},
				});
			}

			return c.json(data);
		},
	);

export default devRoutes;
