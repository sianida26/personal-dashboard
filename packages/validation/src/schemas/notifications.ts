import { z } from "zod";

export const notificationTypeSchema = z.enum(["informational", "approval"]);

export const notificationStatusSchema = z.enum(["unread", "read"]);

export const notificationCategorySchema = z.enum([
	"global",
	"general",
	"system",
]);

export const notificationChannelSchema = z.enum([
	"inApp",
	"email",
	"whatsapp",
]);

export const notificationPreferenceSourceSchema = z.enum([
	"user",
	"default",
	"override",
]);

const notificationDeliveryWindowSchema = z
	.object({
		startHour: z
			.number()
			.int()
			.min(0, { message: "startHour must be between 0-23" })
			.max(23, { message: "startHour must be between 0-23" }),
		endHour: z
			.number()
			.int()
			.min(0, { message: "endHour must be between 0-23" })
			.max(23, { message: "endHour must be between 0-23" }),
		timezone: z.string().min(1).optional(),
		daysOfWeek: z
			.array(z.number().int().min(0).max(6))
			.min(1)
			.max(7)
			.optional(),
	})
	.superRefine((value, ctx) => {
		if (value.endHour === value.startHour) {
			ctx.addIssue({
				code: "custom",
				message: "endHour must be different from startHour",
				path: ["endHour"],
			});
		}

		if (
			value.daysOfWeek &&
			new Set(value.daysOfWeek).size !== value.daysOfWeek.length
		) {
			ctx.addIssue({
				code: "custom",
				message: "daysOfWeek must contain unique values",
				path: ["daysOfWeek"],
			});
		}
	});

export const notificationPreferenceSchema = z.object({
	id: z.cuid2().optional(),
	userId: z.string().min(1),
	category: notificationCategorySchema,
	channel: notificationChannelSchema,
	enabled: z.boolean().prefault(true),
	deliveryWindow: notificationDeliveryWindowSchema.optional(),
	source: notificationPreferenceSourceSchema.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const upsertNotificationPreferenceSchema = notificationPreferenceSchema
	.pick({
		category: true,
		channel: true,
		enabled: true,
		deliveryWindow: true,
	})
	.extend({
		reason: z.string().max(1000).optional(),
	});

export const bulkUpsertNotificationPreferencesSchema = z.object({
	preferences: z.array(upsertNotificationPreferenceSchema).min(1),
});

const metadataSchema = z
	.record(z.string(), z.unknown())
	.prefault({})
	.transform((value) => value ?? {});

const emailOverrideSchema = z
	.object({
		to: z.union([z.string(), z.array(z.string())]).optional(),
		cc: z
			.union([z.string(), z.array(z.string())])
			.optional(),
		bcc: z
			.union([z.string(), z.array(z.string())])
			.optional(),
		subject: z.string().min(1).optional(),
		metadata: metadataSchema.optional(),
	})
	.partial()
	.optional();

const whatsappOverrideSchema = z
	.object({
		phoneNumber: z.union([z.string(), z.number()]).optional(),
		message: z.string().min(1).optional(),
		metadata: metadataSchema.optional(),
		session: z.string().optional(),
		linkPreview: z.boolean().optional(),
		linkPreviewHighQuality: z.boolean().optional(),
	})
	.partial()
	.optional()
	.transform((value) => {
		if (!value) return value;
		const normalized = { ...value } as Record<string, unknown>;
		const rawPhone = normalized.phoneNumber;
		if (typeof rawPhone === "number") {
			normalized.phoneNumber = String(rawPhone);
		} else if (rawPhone !== undefined && typeof rawPhone !== "string") {
			normalized.phoneNumber = undefined;
		}
		return {
			...normalized,
		};
	});

const channelOverridesSchema = z
	.object({
		inApp: metadataSchema.optional(),
		email: emailOverrideSchema,
		whatsapp: whatsappOverrideSchema,
	})
	.partial()
	.optional();

export const notificationActionSchema = z.object({
	id: z.cuid2().optional(),
	actionKey: z
		.string({
			error: "Action key must be a string",
		})
		.min(1)
		.max(50),
	label: z
		.string({
			error: "Label must be a string",
		})
		.min(1)
		.max(100),
	requiresComment: z.boolean().prefault(false),
});

export const notificationActionLogSchema = z.object({
	id: z.cuid2().optional(),
	notificationId: z.cuid2(),
	actionKey: z.string().min(1).max(50),
	actedBy: z.string().min(1),
	comment: z.string().max(1000).nullable().optional(),
	actedAt: z.date().optional(),
});

const notificationAudienceSchema = z
	.object({
		userId: z.string().min(1).optional(),
		userIds: z.array(z.string().min(1)).optional(),
		roleCodes: z.array(z.string().min(1)).optional(),
	})
	.superRefine((value, ctx) => {
		if (
			!value.userId &&
			(!value.userIds || value.userIds.length === 0) &&
			(!value.roleCodes || value.roleCodes.length === 0)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"Provide at least one recipient via userId, userIds, or roleCodes.",
				path: ["userId"],
			});
		}
	});

export const createNotificationSchema = z
	.object({
		id: z.cuid2().optional(),
		type: notificationTypeSchema,
		title: z.string().min(1),
		message: z.string().min(1),
		metadata: metadataSchema,
		status: notificationStatusSchema.optional().prefault("unread"),
		category: notificationCategorySchema,
		actions: z.array(notificationActionSchema).optional(),
		channels: z.array(notificationChannelSchema).optional(),
		channelOverrides: channelOverridesSchema,
		respectPreferences: z.boolean().optional(),
		expiresAt: z
			.union([z.date(), z.iso.datetime(), z.null()])
			.prefault(null)
			.transform((value) => {
				if (!value) return null;
				if (value instanceof Date) return value;
				if (typeof value === "string") return new Date(value);
				return null;
			}),
	})
	.extend(notificationAudienceSchema.shape)
	.superRefine((value, ctx) => {
		if (
			!value.userId &&
			(!value.userIds || value.userIds.length === 0) &&
			(!value.roleCodes || value.roleCodes.length === 0)
		) {
			ctx.addIssue({
				code: "custom",
				message:
					"Provide at least one recipient via userId, userIds, or roleCodes.",
				path: ["userId"],
			});
		}
	});

export const listNotificationsQuerySchema = z
	.object({
		status: notificationStatusSchema.optional(),
		type: notificationTypeSchema.optional(),
		category: z.string().max(50).optional(),
		before: z.iso.datetime().optional(),
		after: z.iso.datetime().optional(),
		cursor: z.iso.datetime().optional(),
		limit: z.coerce.number().int().min(1).max(50).optional(),
	})
	.strict();

export const bulkMarkNotificationsSchema = z.object({
	ids: z.array(z.cuid2()).min(1),
	markAs: notificationStatusSchema,
});

export const singleMarkNotificationSchema = z.object({
	markAs: notificationStatusSchema,
});

export const notificationActionExecutionSchema = z.object({
	notificationId: z.cuid2(),
	actionKey: z.string().min(1).max(50),
	comment: z
		.string()
		.max(1000)
		.optional()
		.transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>;
export type NotificationStatusEnum = z.infer<typeof notificationStatusSchema>;
export type NotificationActionInput = z.infer<typeof notificationActionSchema>;
export type NotificationActionLogInput = z.infer<
	typeof notificationActionLogSchema
>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsQuery = z.infer<
	typeof listNotificationsQuerySchema
>;
export type BulkMarkNotificationsInput = z.infer<
	typeof bulkMarkNotificationsSchema
>;
export type SingleMarkNotificationInput = z.infer<
	typeof singleMarkNotificationSchema
>;
export type NotificationActionExecutionInput = z.infer<
	typeof notificationActionExecutionSchema
>;
export type NotificationCategoryEnum = z.infer<
	typeof notificationCategorySchema
>;
export type NotificationChannelEnum = z.infer<typeof notificationChannelSchema>;
export type NotificationPreferenceSourceEnum = z.infer<
	typeof notificationPreferenceSourceSchema
>;
export type NotificationPreference = z.infer<
	typeof notificationPreferenceSchema
>;
export type UpsertNotificationPreferenceInput = z.infer<
	typeof upsertNotificationPreferenceSchema
>;
export type BulkUpsertNotificationPreferencesInput = z.infer<
	typeof bulkUpsertNotificationPreferencesSchema
>;
