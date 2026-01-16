import { z } from "zod";
import { paginationRequestSchema } from "./paginationSchema";

// ==================== CATEGORY SCHEMAS ====================

export const categoryTypeSchema = z.enum(["income", "expense"]);

export const categoryCreateSchema = z.object({
	name: z.string().min(1, "Name is required").max(255, "Name is too long"),
	type: categoryTypeSchema,
	icon: z.string().max(50, "Icon name is too long").optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
		.optional(),
	parentId: z.string().optional(),
});

export const categoryUpdateSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name is too long")
		.optional(),
	icon: z.string().max(50, "Icon name is too long").nullable().optional(),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
		.nullable()
		.optional(),
	parentId: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
});

export const categoryQuerySchema = z.object({
	type: categoryTypeSchema.optional(),
	includeInactive: z
		.string()
		.optional()
		.transform((v) => v?.toLowerCase() === "true"),
	asTree: z
		.string()
		.optional()
		.transform((v) => v?.toLowerCase() === "true"),
});

// ==================== TRANSACTION SCHEMAS ====================

export const transactionTypeSchema = z.enum(["income", "expense", "transfer"]);

export const transactionCreateSchema = z
	.object({
		type: transactionTypeSchema,
		amount: z.coerce.number().positive("Amount must be positive"),
		accountId: z.string().min(1, "Account is required"),
		categoryId: z.string().optional(),
		date: z.coerce.date(),
		description: z.string().max(500, "Description is too long").optional(),
		toAccountId: z.string().optional(),
		tags: z
			.array(z.string().max(50, "Tag is too long"))
			.max(10, "Maximum 10 tags allowed")
			.optional(),
		labels: z
			.array(z.string().max(100, "Label is too long"))
			.max(20, "Maximum 20 labels allowed")
			.optional(),
		attachmentUrl: z.string().url("Invalid URL").optional(),
	})
	.refine((data) => data.type !== "transfer" || data.toAccountId, {
		message: "Destination account is required for transfer",
		path: ["toAccountId"],
	})
	.refine(
		(data) =>
			data.type !== "transfer" || data.accountId !== data.toAccountId,
		{
			message: "Cannot transfer to the same account",
			path: ["toAccountId"],
		},
	);

export const transactionUpdateSchema = z.object({
	amount: z.coerce.number().positive("Amount must be positive").optional(),
	categoryId: z.string().nullable().optional(),
	date: z.coerce.date().optional(),
	description: z
		.string()
		.max(500, "Description is too long")
		.nullable()
		.optional(),
	tags: z
		.array(z.string().max(50, "Tag is too long"))
		.max(10, "Maximum 10 tags allowed")
		.nullable()
		.optional(),
	labels: z
		.array(z.string().max(100, "Label is too long"))
		.max(20, "Maximum 20 labels allowed")
		.nullable()
		.optional(),
	attachmentUrl: z.string().url("Invalid URL").nullable().optional(),
});

export const transactionQuerySchema = paginationRequestSchema.extend({
	type: transactionTypeSchema.optional(),
	categoryId: z.string().optional(),
	accountId: z.string().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	minAmount: z.coerce.number().optional(),
	maxAmount: z.coerce.number().optional(),
});

export const transactionExportSchema = z.object({
	format: z.enum(["csv", "excel"]),
	type: transactionTypeSchema.optional(),
	categoryId: z.string().optional(),
	accountId: z.string().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

// ==================== TYPE EXPORTS ====================

export type CategoryType = z.infer<typeof categoryTypeSchema>;
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type TransactionExport = z.infer<typeof transactionExportSchema>;
