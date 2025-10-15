import { z } from "zod";

export const notificationTypeSchema = z.enum([
	"informational",
	"approval",
]);

export const notificationStatusSchema = z.enum(["unread", "read"]);

const metadataSchema = z
	.record(z.string(), z.unknown())
	.default({})
	.transform((value) => value ?? {});

export const notificationActionSchema = z.object({
	id: z.string().cuid2().optional(),
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
	requiresComment: z.boolean().default(false),
});

export const notificationActionLogSchema = z.object({
	id: z.string().cuid2().optional(),
	notificationId: z.string().cuid2(),
	actionKey: z.string().min(1).max(50),
	actedBy: z.string().min(1),
	comment: z
		.string()
		.max(1000)
		.nullable()
		.optional(),
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
				code: z.ZodIssueCode.custom,
				message:
					"Provide at least one recipient via userId, userIds, or roleCodes.",
				path: ["userId"],
			});
		}
	});

export const createNotificationSchema = z
	.object({
		id: z.string().cuid2().optional(),
		type: notificationTypeSchema,
		title: z.string().min(1),
		message: z.string().min(1),
		metadata: metadataSchema,
		status: notificationStatusSchema.default("unread"),
		category: z.string().max(50).optional(),
		actions: z.array(notificationActionSchema).optional(),
		expiresAt: z
			.union([z.date(), z.string().datetime(), z.null()])
			.optional()
			.transform((value) => {
				if (!value) return null;
				if (value instanceof Date) return value;
				if (typeof value === "string") return new Date(value);
				return null;
			}),
	})
	.merge(notificationAudienceSchema)
	.superRefine((value, ctx) => {
		if (
			!value.userId &&
			(!value.userIds || value.userIds.length === 0) &&
			(!value.roleCodes || value.roleCodes.length === 0)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
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
		before: z.string().datetime().optional(),
		after: z.string().datetime().optional(),
		cursor: z.string().datetime().optional(),
		limit: z.coerce.number().int().min(1).max(50).optional(),
	})
	.strict();

export const bulkMarkNotificationsSchema = z.object({
	ids: z.array(z.string().cuid2()).min(1),
	markAs: notificationStatusSchema,
});

export const singleMarkNotificationSchema = z.object({
	markAs: notificationStatusSchema,
});

export const notificationActionExecutionSchema = z.object({
	notificationId: z.string().cuid2(),
	actionKey: z.string().min(1).max(50),
	comment: z
		.string()
		.max(1000)
		.optional()
		.transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export type NotificationTypeEnum = z.infer<typeof notificationTypeSchema>;
export type NotificationStatusEnum = z.infer<typeof notificationStatusSchema>;
export type NotificationActionInput = z.infer<
	typeof notificationActionSchema
>;
export type NotificationActionLogInput = z.infer<
	typeof notificationActionLogSchema
>;
export type CreateNotificationInput = z.infer<
	typeof createNotificationSchema
>;
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
