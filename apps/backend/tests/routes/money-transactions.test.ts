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

describe("Money Tracker - Transactions API", () => {
	let testUser: TestUserData;
	let testAccountId: string;
	let testAccount2Id: string;
	let expenseCategoryId: string;
	let incomeCategoryId: string;
	const createdTransactionIds: string[] = [];

	beforeAll(async () => {
		testUser = await createUserForTesting({
			name: "Money Test User - Transactions",
			username: `money-transactions-test-${Date.now()}`,
			permissions: [],
		});

		// Create test accounts
		const [account1] = await db
			.insert(moneyAccounts)
			.values({
				userId: testUser.user.id,
				name: "Test Bank Account",
				type: "bank",
				balance: "10000.00",
				currency: "IDR",
			})
			.returning();
		testAccountId = account1.id;

		const [account2] = await db
			.insert(moneyAccounts)
			.values({
				userId: testUser.user.id,
				name: "Test Cash Account",
				type: "cash",
				balance: "5000.00",
				currency: "IDR",
			})
			.returning();
		testAccount2Id = account2.id;

		// Create test categories
		const [expenseCategory] = await db
			.insert(moneyCategories)
			.values({
				userId: testUser.user.id,
				name: "Test Expense Category",
				type: "expense",
			})
			.returning();
		expenseCategoryId = expenseCategory.id;

		const [incomeCategory] = await db
			.insert(moneyCategories)
			.values({
				userId: testUser.user.id,
				name: "Test Income Category",
				type: "income",
			})
			.returning();
		incomeCategoryId = incomeCategory.id;
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
			.where(eq(moneyCategories.id, incomeCategoryId));

		// Clean up accounts
		await db
			.delete(moneyAccounts)
			.where(eq(moneyAccounts.id, testAccountId));
		await db
			.delete(moneyAccounts)
			.where(eq(moneyAccounts.id, testAccount2Id));

		await cleanupTestUser(testUser.user.id);
	});

	describe("POST /money/transactions", () => {
		test("should create an income transaction", async () => {
			const initialBalance = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});

			const response = await client.money.transactions.$post(
				{
					json: {
						type: "income",
						amount: 1000,
						accountId: testAccountId,
						categoryId: incomeCategoryId,
						date: new Date().toISOString(),
						description: "Test income",
						tags: ["test", "salary"],
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data).toHaveProperty("id");
			expect(result.data.type).toBe("income");
			expect(Number(result.data.amount)).toBe(1000);
			expect(result.data.description).toBe("Test income");

			createdTransactionIds.push(result.data.id);

			// Verify account balance increased
			const updatedBalance = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(updatedBalance?.balance)).toBe(
				Number(initialBalance?.balance) + 1000,
			);
		});

		test("should create an expense transaction", async () => {
			const initialBalance = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});

			const response = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 500,
						accountId: testAccountId,
						categoryId: expenseCategoryId,
						date: new Date().toISOString(),
						description: "Test expense",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data.type).toBe("expense");
			expect(Number(result.data.amount)).toBe(500);

			createdTransactionIds.push(result.data.id);

			// Verify account balance decreased
			const updatedBalance = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(updatedBalance?.balance)).toBe(
				Number(initialBalance?.balance) - 500,
			);
		});

		test("should create a transfer transaction", async () => {
			const initialSource = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const initialDest = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccount2Id),
			});

			const response = await client.money.transactions.$post(
				{
					json: {
						type: "transfer",
						amount: 200,
						accountId: testAccountId,
						toAccountId: testAccount2Id,
						date: new Date().toISOString(),
						description: "Test transfer",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(201);
			const result = await response.json();
			expect(result.data.type).toBe("transfer");
			expect(result.data.toAccountId).toBe(testAccount2Id);

			createdTransactionIds.push(result.data.id);

			// Verify balances
			const updatedSource = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const updatedDest = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccount2Id),
			});

			expect(Number(updatedSource?.balance)).toBe(
				Number(initialSource?.balance) - 200,
			);
			expect(Number(updatedDest?.balance)).toBe(
				Number(initialDest?.balance) + 200,
			);
		});

		test("should fail transfer to same account", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "transfer",
						amount: 100,
						accountId: testAccountId,
						toAccountId: testAccountId,
						date: new Date().toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			// Validation errors return 422
			expect(response.status).toBe(422);
		});

		test("should fail transfer without destination account", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "transfer",
						amount: 100,
						accountId: testAccountId,
						date: new Date().toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			// Validation errors return 422
			expect(response.status).toBe(422);
		});

		test("should fail with mismatched category type", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 100,
						accountId: testAccountId,
						categoryId: incomeCategoryId, // income category for expense
						date: new Date().toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(400);
		});

		test("should fail with invalid account", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 100,
						accountId: "non-existent-account",
						date: new Date().toISOString(),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(400);
		});

		test("should fail without authentication", async () => {
			const response = await client.money.transactions.$post({
				json: {
					type: "expense",
					amount: 100,
					accountId: testAccountId,
					date: new Date().toISOString(),
				},
			});

			// Missing auth returns 401 or 500 depending on middleware
			expect([401, 500]).toContain(response.status);
		});
	});

	describe("GET /money/transactions", () => {
		test("should return paginated transactions", async () => {
			const response = await client.money.transactions.$get(
				{
					query: {
						page: "1",
						limit: "10",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(Array.isArray(result.data)).toBe(true);
			expect(result._metadata).toHaveProperty("currentPage");
			expect(result._metadata).toHaveProperty("totalPages");
			expect(result._metadata).toHaveProperty("totalItems");
		});

		test("should filter by type", async () => {
			const response = await client.money.transactions.$get(
				{
					query: {
						page: "1",
						limit: "10",
						type: "income",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(
				result.data.every((t: { type: string }) => t.type === "income"),
			).toBe(true);
		});

		test("should filter by account", async () => {
			const response = await client.money.transactions.$get(
				{
					query: {
						page: "1",
						limit: "10",
						accountId: testAccountId,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(
				result.data.every(
					(t: { accountId: string }) => t.accountId === testAccountId,
				),
			).toBe(true);
		});

		test("should search in description", async () => {
			const response = await client.money.transactions.$get(
				{
					query: {
						page: "1",
						limit: "10",
						q: "Test income",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(Array.isArray(result.data)).toBe(true);
		});
	});

	describe("GET /money/transactions/:id", () => {
		test("should return transaction by id", async () => {
			const transactionId = createdTransactionIds[0];

			const response = await client.money.transactions[":id"].$get(
				{
					param: { id: transactionId },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.id).toBe(transactionId);
			expect(result.data).toHaveProperty("account");
		});

		test("should return 404 for non-existent transaction", async () => {
			const response = await client.money.transactions[":id"].$get(
				{
					param: { id: "non-existent-id" },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});

	describe("PUT /money/transactions/:id", () => {
		test("should update transaction amount and adjust balance", async () => {
			const transactionId = createdTransactionIds[0]; // income transaction

			// Get current balance
			const beforeUpdate = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});

			// Get transaction amount
			const transaction = await db.query.moneyTransactions.findFirst({
				where: eq(moneyTransactions.id, transactionId),
			});
			const oldAmount = Number(transaction?.amount);

			const response = await client.money.transactions[":id"].$put(
				{
					param: { id: transactionId },
					json: {
						amount: 1500, // Change from 1000 to 1500
						description: "Updated income",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(Number(result.data.amount)).toBe(1500);
			expect(result.data.description).toBe("Updated income");

			// Verify balance adjustment (should increase by 500)
			const afterUpdate = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(afterUpdate?.balance)).toBe(
				Number(beforeUpdate?.balance) + 500, // diff: 1500 - 1000
			);
		});

		test("should update transaction description only", async () => {
			const transactionId = createdTransactionIds[0];

			const response = await client.money.transactions[":id"].$put(
				{
					param: { id: transactionId },
					json: {
						description: "New description",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.description).toBe("New description");
		});

		test("should return 404 for non-existent transaction", async () => {
			const response = await client.money.transactions[":id"].$put(
				{
					param: { id: "non-existent-id" },
					json: {
						description: "Updated",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /money/transactions/:id", () => {
		test("should delete transaction and reverse balance", async () => {
			// Create a transaction to delete
			const createResponse = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 300,
						accountId: testAccountId,
						date: new Date().toISOString(),
						description: "To be deleted",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			const createResult = await createResponse.json();
			const transactionId = createResult.data.id;

			// Get balance after creation
			const beforeDelete = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});

			// Delete the transaction
			const response = await client.money.transactions[":id"].$delete(
				{
					param: { id: transactionId },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.message).toBe("Transaction deleted successfully");

			// Verify balance was reversed (expense deleted = balance increases)
			const afterDelete = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(afterDelete?.balance)).toBe(
				Number(beforeDelete?.balance) + 300,
			);
		});

		test("should return 404 for non-existent transaction", async () => {
			const response = await client.money.transactions[":id"].$delete(
				{
					param: { id: "non-existent-id" },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(404);
		});
	});

	describe("GET /money/transactions/export", () => {
		test("should export transactions as CSV", async () => {
			const response = await client.money.transactions.export.$get(
				{
					query: {
						format: "csv",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toContain("text/csv");
		});

		test("should return 501 for excel format", async () => {
			const response = await client.money.transactions.export.$get(
				{
					query: {
						format: "excel",
					},
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(501);
		});
	});
});
