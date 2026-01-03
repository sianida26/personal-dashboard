import { z } from "zod";

// ==================== ANALYTICS SCHEMAS ====================

export const moneyAnalyticsQuerySchema = z.object({
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	accountId: z.string().optional(),
});

// Summary response type
export const moneyAnalyticsSummarySchema = z.object({
	totalIncome: z.number(),
	totalExpense: z.number(),
	netFlow: z.number(),
	transactionCount: z.number(),
});

// Daily trend item
export const moneyDailyTrendItemSchema = z.object({
	date: z.string(),
	income: z.number(),
	expense: z.number(),
	net: z.number(),
});

// Category breakdown item
export const moneyCategoryBreakdownItemSchema = z.object({
	categoryId: z.string().nullable(),
	categoryName: z.string(),
	categoryIcon: z.string().nullable(),
	categoryColor: z.string().nullable(),
	total: z.number(),
	percentage: z.number(),
	count: z.number(),
});

// Monthly trend item
export const moneyMonthlyTrendItemSchema = z.object({
	month: z.string(),
	income: z.number(),
	expense: z.number(),
	net: z.number(),
});

// ==================== TYPE EXPORTS ====================

export type MoneyAnalyticsQuery = z.infer<typeof moneyAnalyticsQuerySchema>;
export type MoneyAnalyticsSummary = z.infer<typeof moneyAnalyticsSummarySchema>;
export type MoneyDailyTrendItem = z.infer<typeof moneyDailyTrendItemSchema>;
export type MoneyCategoryBreakdownItem = z.infer<
	typeof moneyCategoryBreakdownItemSchema
>;
export type MoneyMonthlyTrendItem = z.infer<typeof moneyMonthlyTrendItemSchema>;
