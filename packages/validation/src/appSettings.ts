import { appSettingKeys } from "@repo/data";
import { z } from "zod";
export const appSettingSchema = z.object({
	id: z.string().optional(),
	key: z.enum(appSettingKeys as [string, ...string[]]),
	value: z.string().min(1, "Value is required"),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

export const appSettingCreateSchema = appSettingSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const appSettingUpdateSchema = z.object({
	id: z.string(),
	value: z.string().optional(),
});

export const appSettingDeleteSchema = z.object({ id: z.string() });

export type AppSetting = z.infer<typeof appSettingSchema>;
export type AppSettingCreate = z.infer<typeof appSettingCreateSchema>;
export type AppSettingUpdate = z.infer<typeof appSettingUpdateSchema>; 