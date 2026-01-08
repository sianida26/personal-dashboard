import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../src/drizzle";
import { moneyAccounts } from "../../src/drizzle/schema/moneyAccounts";
import { moneyCategories } from "../../src/drizzle/schema/moneyCategories";
import { moneyTransactions } from "../../src/drizzle/schema/moneyTransactions";
import type { TestUserData } from "../../src/utils/test-utils/create-user-for-testing";
import {
	cleanupTestUser,
	createUserForTesting,
} from "../../src/utils/test-utils/create-user-for-testing";
import client from "../../src/utils/test-utils/hono-test-client";

describe("Money Tracker - Analytics API", () => {
	let testUser: TestUserData;
	let testAccountId: string;
	let expenseCategoryId: string;
	let expenseCategory2Id: string;
	let incomeCategoryId: string;
	const createdTransactionIds: string[] = [];

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Money Test User - Analytics",
			username: `money-analytics-test-${Date.now()}`,
			permissions: [],
		});

		// Create test account
		const [account] = await db
			.insert(moneyAccounts)
			.values({
				userId: testUser.user.id,
				name: "Test Analytics Account",
				type: "bank",
				balance: "100000.00",
				currency: "IDR",
			})
			.returning();
		testAccountId = account.id;

		// Create test categories
		const [expenseCategory] = await db
			.insert(moneyCategories)
			.values({
				userId: testUser.user.id,
				name: "Food & Drinks",
				type: "expense",
				icon: "🍔",
				color: "#FF5733",
			})
			.returning();
		expenseCategoryId = expenseCategory.id;

		const [expenseCategory2] = await db
			.insert(moneyCategories)
			.values({
				userId: testUser.user.id,
				name: "Transportation",
				type: "expense",
				icon: "🚗",
				color: "#33FF57",
			})
			.returning();
		expenseCategory2Id = expenseCategory2.id;

		const [incomeCategory] = await db
			.insert(moneyCategories)
			.values({
				userId: testUser.user.id,
				name: "Salary",
				type: "income",
				icon: "💰",
				color: "#5733FF",
			})
			.returning();
		incomeCategoryId = incomeCategory.id;

		// Create test transactions across different dates
		const today = new Date();
		const transactions = [
			// Income transactions
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: incomeCategoryId,
				type: "income" as const,
				amount: "5000000.00",
				description: "Monthly salary",
				date: new Date(today.getFullYear(), today.getMonth(), 1),
			},
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: incomeCategoryId,
				type: "income" as const,
				amount: "500000.00",
				description: "Bonus",
				date: new Date(today.getFullYear(), today.getMonth(), 15),
			},
			// Expense transactions
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: expenseCategoryId,
				type: "expense" as const,
				amount: "150000.00",
				description: "Lunch",
				date: new Date(today.getFullYear(), today.getMonth(), 5),
			},
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: expenseCategoryId,
				type: "expense" as const,
				amount: "200000.00",
				description: "Dinner",
				date: new Date(today.getFullYear(), today.getMonth(), 10),
			},
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: expenseCategory2Id,
				type: "expense" as const,
				amount: "300000.00",
				description: "Gas",
				date: new Date(today.getFullYear(), today.getMonth(), 8),
			},
			// Uncategorized expense
			{
				userId: testUser.user.id,
				accountId: testAccountId,
				categoryId: null,
				type: "expense" as const,
				amount: "50000.00",
				description: "Misc expense",
				date: new Date(today.getFullYear(), today.getMonth(), 12),
			},
		];

		for (const tx of transactions) {
			const [created] = await db
				.insert(moneyTransactions)
				.values(tx)
				.returning();
			createdTransactionIds.push(created.id);
		}
	});

	afterAll(async () => {
		// Clean up transactions
		for (const transactionId of createdTransactionIds) {
			await db
				.delete(moneyTransactions)
				.where(eq(moneyTransactions.id, transactionId));
		}

		// Clean up categories
		await db
			.delete(moneyCategories)
			.where(eq(moneyCategories.id, expenseCategoryId));
		await db
			.delete(moneyCategories)
			.where(eq(moneyCategories.id, expenseCategory2Id));
		await db
			.delete(moneyCategories)
			.where(eq(moneyCategories.id, incomeCategoryId));

		// Clean up accounts
		await db
			.delete(moneyAccounts)
			.where(eq(moneyAccounts.id, testAccountId));

		await cleanupTestUser(testUser.user.id);
	});

	describe("GET /api/money/analytics", () => {
		test("should return 401 without authentication", async () => {
			const res = await client.money.analytics.$get({
				query: {},
			});
			expect(res.status).toBe(401);
		});

		test("should return analytics data with default date range", async () => {
			const res = await client.money.analytics.$get(
				{
					query: {},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Check summary structure
			expect(data.summary).toBeDefined();
			expect(typeof data.summary.totalIncome).toBe("number");
			expect(typeof data.summary.totalExpense).toBe("number");
			expect(typeof data.summary.netFlow).toBe("number");
			expect(typeof data.summary.transactionCount).toBe("number");

			// Check daily trends structure
			expect(Array.isArray(data.dailyTrends)).toBe(true);

			// Check monthly trends structure
			expect(Array.isArray(data.monthlyTrends)).toBe(true);

			// Check category breakdowns
			expect(Array.isArray(data.expenseBreakdown)).toBe(true);
			expect(Array.isArray(data.incomeBreakdown)).toBe(true);

			// Check date range
			expect(data.dateRange).toBeDefined();
			expect(data.dateRange.startDate).toBeDefined();
			expect(data.dateRange.endDate).toBeDefined();
		});

		test("should return correct summary values", async () => {
			const today = new Date();
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Expected: 5,000,000 + 500,000 = 5,500,000 income
			expect(data.summary.totalIncome).toBe(5500000);

			// Expected: 150,000 + 200,000 + 300,000 + 50,000 = 700,000 expense
			expect(data.summary.totalExpense).toBe(700000);

			// Net flow: 5,500,000 - 700,000 = 4,800,000
			expect(data.summary.netFlow).toBe(4800000);

			// Total transactions: 6
			expect(data.summary.transactionCount).toBe(6);
		});

		test("should return expense breakdown by category", async () => {
			const today = new Date();
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Should have 3 expense categories (Food, Transportation, Uncategorized)
			expect(data.expenseBreakdown.length).toBe(3);

			// Find Food & Drinks category
			const foodCategory = data.expenseBreakdown.find(
				(c: { categoryName: string }) =>
					c.categoryName === "Food & Drinks",
			);
			expect(foodCategory).toBeDefined();
			expect(foodCategory.total).toBe(350000); // 150,000 + 200,000
			expect(foodCategory.count).toBe(2);
			expect(foodCategory.categoryIcon).toBe("🍔");
			expect(foodCategory.categoryColor).toBe("#FF5733");

			// Find Transportation category
			const transportCategory = data.expenseBreakdown.find(
				(c: { categoryName: string }) =>
					c.categoryName === "Transportation",
			);
			expect(transportCategory).toBeDefined();
			expect(transportCategory.total).toBe(300000);
			expect(transportCategory.count).toBe(1);

			// Find uncategorized
			const uncategorized = data.expenseBreakdown.find(
				(c: { categoryName: string }) =>
					c.categoryName === "Tidak berkategori",
			);
			expect(uncategorized).toBeDefined();
			expect(uncategorized.total).toBe(50000);
			expect(uncategorized.count).toBe(1);
		});

		test("should return income breakdown by category", async () => {
			const today = new Date();
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Should have 1 income category (Salary)
			expect(data.incomeBreakdown.length).toBe(1);

			const salaryCategory = data.incomeBreakdown[0];
			expect(salaryCategory.categoryName).toBe("Salary");
			expect(salaryCategory.total).toBe(5500000); // 5,000,000 + 500,000
			expect(salaryCategory.count).toBe(2);
			expect(salaryCategory.percentage).toBe(100);
			expect(salaryCategory.categoryIcon).toBe("💰");
		});

		test("should return daily trends", async () => {
			const today = new Date();
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Should have multiple daily entries
			expect(data.dailyTrends.length).toBeGreaterThan(0);

			// Check structure of daily trend item
			for (const trend of data.dailyTrends) {
				expect(trend.date).toBeDefined();
				expect(typeof trend.income).toBe("number");
				expect(typeof trend.expense).toBe("number");
				expect(typeof trend.net).toBe("number");
				expect(trend.net).toBe(trend.income - trend.expense);
			}
		});

		test("should filter by date range", async () => {
			const today = new Date();
			// Only get first week of month
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(today.getFullYear(), today.getMonth(), 7);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Should only include transactions from day 1-7
			// Day 1: 5,000,000 income, Day 5: 150,000 expense
			expect(data.summary.totalIncome).toBe(5000000);
			expect(data.summary.totalExpense).toBe(150000);
			expect(data.summary.transactionCount).toBe(2);
		});

		test("should filter by account", async () => {
			const res = await client.money.analytics.$get(
				{
					query: {
						accountId: testAccountId,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// All transactions should be from the test account
			expect(data.summary.transactionCount).toBeGreaterThan(0);
		});

		test("should return empty data for date range with no transactions", async () => {
			// Use a date range in the past with no transactions
			const startDate = new Date(2020, 0, 1);
			const endDate = new Date(2020, 0, 31);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			expect(data.summary.totalIncome).toBe(0);
			expect(data.summary.totalExpense).toBe(0);
			expect(data.summary.netFlow).toBe(0);
			expect(data.summary.transactionCount).toBe(0);
			expect(data.dailyTrends.length).toBe(0);
			expect(data.expenseBreakdown.length).toBe(0);
			expect(data.incomeBreakdown.length).toBe(0);
		});

		test("should calculate correct percentages", async () => {
			const today = new Date();
			const startDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const endDate = new Date(
				today.getFullYear(),
				today.getMonth() + 1,
				0,
			);

			const res = await client.money.analytics.$get(
				{
					query: {
						startDate: startDate.toISOString(),
						endDate: endDate.toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(res.status).toBe(200);
			const data = await res.json();

			// Sum of percentages should be 100
			const totalExpensePercentage = data.expenseBreakdown.reduce(
				(sum: number, item: { percentage: number }) =>
					sum + item.percentage,
				0,
			);
			expect(Math.round(totalExpensePercentage)).toBe(100);

			const totalIncomePercentage = data.incomeBreakdown.reduce(
				(sum: number, item: { percentage: number }) =>
					sum + item.percentage,
				0,
			);
			expect(Math.round(totalIncomePercentage)).toBe(100);
		});

		test("should aggregate multiple transactions on the same day", async () => {
			// Create additional transactions on the same day to test aggregation
			const today = new Date();
			const testDate = new Date(
				today.getFullYear(),
				today.getMonth(),
				20,
			);

			const sameDayTransactions = [
				{
					userId: testUser.user.id,
					accountId: testAccountId,
					categoryId: expenseCategoryId,
					type: "expense" as const,
					amount: "100000.00",
					description: "Breakfast",
					date: testDate,
				},
				{
					userId: testUser.user.id,
					accountId: testAccountId,
					categoryId: expenseCategoryId,
					type: "expense" as const,
					amount: "150000.00",
					description: "Lunch",
					date: testDate,
				},
				{
					userId: testUser.user.id,
					accountId: testAccountId,
					categoryId: expenseCategoryId,
					type: "expense" as const,
					amount: "200000.00",
					description: "Dinner",
					date: testDate,
				},
			];

			const sameDayTransactionIds: string[] = [];
			for (const tx of sameDayTransactions) {
				const [created] = await db
					.insert(moneyTransactions)
					.values(tx)
					.returning();
				sameDayTransactionIds.push(created.id);
			}

			try {
				const startDate = new Date(
					today.getFullYear(),
					today.getMonth(),
					20,
				);
				const endDate = new Date(
					today.getFullYear(),
					today.getMonth(),
					20,
				);

				const res = await client.money.analytics.$get(
					{
						query: {
							startDate: startDate.toISOString(),
							endDate: endDate.toISOString(),
						},
					},
					{
						headers: {
							Authorization: `Bearer ${testUser.accessToken}`,
						},
					},
				);

				expect(res.status).toBe(200);
				const data = await res.json();

				// Should have 1 daily trend item
				expect(data.dailyTrends.length).toBe(1);

				const trend = data.dailyTrends[0];
				expect(trend.income).toBe(0);
				// Should sum all 3 transactions: 100,000 + 150,000 + 200,000 = 450,000
				expect(trend.expense).toBe(450000);
				expect(trend.net).toBe(-450000);
			} finally {
				// Clean up same-day transactions
				for (const txId of sameDayTransactionIds) {
					await db
						.delete(moneyTransactions)
						.where(eq(moneyTransactions.id, txId));
				}
			}
		});
	});
});
