import { z } from "zod";

export const sortSchema = z
	.string()
	.optional()
	.transform((value) => {
		if (!value) return undefined;
		try {
			return value
				.split(",")
				.map((item) => {
					const parts = item.split(":");
					if (!parts[0]) return undefined;
					return {
						id: parts[0].trim(),
						desc: parts[1]?.toLowerCase() === "desc",
					};
				})
				.filter(
					(item): item is { id: string; desc: boolean } =>
						item !== undefined,
				);
		} catch {
			return undefined;
		}
	});

export const filterSchema = z
	.string()
	.optional()
	.transform((value) => {
		if (!value) return undefined;
		try {
			return value
				.split(",")
				.map((item) => {
					const parts = item.split(":");
					if (!parts[0]) return undefined;
					return {
						id: parts[0].trim(),
						value: parts[1]?.trim(),
					};
				})
				.filter(
					(item): item is { id: string; value: string } =>
						item !== undefined,
				);
		} catch {
			return undefined;
		}
	});

export const paginationRequestSchema = z.object({
	includeTrashed: z
		.string()
		.optional()
		.transform((v) => v?.toLowerCase() === "true"),
	page: z.coerce.number().int().min(1).default(0),
	limit: z.coerce.number().int().min(1).max(1000).default(1),
	sort: sortSchema,
	filter: filterSchema,
	q: z.string().default(""),
});

export type PaginationRequest = z.infer<typeof paginationRequestSchema>;
