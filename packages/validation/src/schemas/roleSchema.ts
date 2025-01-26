import { permissions } from "@repo/data";
import { z } from "zod";

export const roleFormSchema = z.object({
	name: z.string().min(1).max(255),
	code: z.string().min(1).max(255).optional(),
	description: z.string(),
	permissions: z.array(z.enum(permissions)).optional(),
});
