import { z } from "zod";

export const userFormSchema = z.object({
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

export const userUpdateSchema = userFormSchema.extend({
	password: z.string().min(6).optional().or(z.literal("")),
});
