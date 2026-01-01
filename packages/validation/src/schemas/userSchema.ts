import { z } from "zod";

export const userFormSchema = z.object({
	name: z.string().min(1).max(255),
	username: z.string().min(1).max(255),
	email: z.email().optional().or(z.literal("")),
	password: z.string().min(6),
	isEnabled: z.boolean().prefault(true),
	roles: z.array(z.string()).optional(),
	permissions: z.string().array(),
});

export const userUpdateSchema = userFormSchema.extend({
	password: z.string().min(6).optional().or(z.literal("")),
});
