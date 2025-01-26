import { z } from "zod";

export const paginationRequestSchema = z.object({
	includeTrashed: z
		.string()
		.optional()
		.transform((v) => v?.toLowerCase() === "true"),
	page: z.coerce.number().int().min(1).default(0),
	limit: z.coerce.number().int().min(1).max(1000).default(1),
	q: z.string().default(""),
});
