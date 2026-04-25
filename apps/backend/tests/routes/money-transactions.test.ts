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
	let paylaterAccountId: string | undefined;
	let explicitDefaultAccountId: string | undefined;
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
		if (paylaterAccountId) {
			await db
				.delete(moneyAccounts)
				.where(eq(moneyAccounts.id, paylaterAccountId));
		}
		if (explicitDefaultAccountId) {
			await db
				.delete(moneyAccounts)
				.where(eq(moneyAccounts.id, explicitDefaultAccountId));
		}

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

		test("should reject manual reconcile creation from transactions endpoint", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "reconcile",
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

			expect(response.status).toBe(400);
		});

		test("should use deterministic default account when accountId is omitted", async () => {
			const response = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 123,
						categoryId: expenseCategoryId,
						date: new Date().toISOString(),
						description: "No account in payload",
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
			expect(result.data.accountId).toBe(testAccountId);
			createdTransactionIds.push(result.data.id);

			const account1 = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const account2 = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccount2Id),
			});
			expect(account1?.isDefault).toBe(true);
			expect(account2?.isDefault).toBe(false);
		});
	});

	describe("POST /money/accounts", () => {
		test("should create a paylater account", async () => {
			const response = await client.money.accounts.$post(
				{
					json: {
						name: "Test Paylater Account",
						type: "paylater",
						balance: 0,
						currency: "IDR",
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
			expect(result.data.type).toBe("paylater");
			paylaterAccountId = result.data.id;
		});

		test("should create expense transaction on paylater account", async () => {
			expect(paylaterAccountId).toBeDefined();

			const before = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, paylaterAccountId as string),
			});

			const response = await client.money.transactions.$post(
				{
					json: {
						type: "expense",
						amount: 250,
						accountId: paylaterAccountId as string,
						categoryId: expenseCategoryId,
						date: new Date().toISOString(),
						description: "Test paylater expense",
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
			expect(result.data.accountId).toBe(paylaterAccountId);
			createdTransactionIds.push(result.data.id);

			const after = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, paylaterAccountId as string),
			});

			expect(Number(after?.balance)).toBe(Number(before?.balance) - 250);
		});

		test("should allow creating a new explicit default account", async () => {
			const response = await client.money.accounts.$post(
				{
					json: {
						name: "Test Explicit Default",
						type: "bank",
						balance: 0,
						currency: "IDR",
						isDefault: true,
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
			explicitDefaultAccountId = result.data.id;
			expect(result.data.isDefault).toBe(true);

			const previousDefault = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(previousDefault?.isDefault).toBe(false);
		});
	});

	describe("POST /money/accounts/:id/reconcile", () => {
		test("should create reconcile transaction for positive delta", async () => {
			const before = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const currentBalance = Number(before?.balance ?? 0);
			const actualBalance = currentBalance + 321;

			const response = await client.money.accounts[":id"].reconcile.$post(
				{
					param: { id: testAccountId },
					json: { actualBalance },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.noOp).toBe(false);
			expect(result.data.delta).toBe(321);
			expect(result.data.transaction.type).toBe("reconcile");

			createdTransactionIds.push(result.data.transaction.id);

			const after = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(after?.balance)).toBe(actualBalance);
		});

		test("should create reconcile transaction for negative delta", async () => {
			const before = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const currentBalance = Number(before?.balance ?? 0);
			const actualBalance = currentBalance - 123;

			const response = await client.money.accounts[":id"].reconcile.$post(
				{
					param: { id: testAccountId },
					json: { actualBalance },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.noOp).toBe(false);
			expect(result.data.delta).toBe(-123);
			expect(result.data.transaction.type).toBe("reconcile");

			createdTransactionIds.push(result.data.transaction.id);

			const after = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(after?.balance)).toBe(actualBalance);
		});

		test("should return no-op when delta is zero", async () => {
			const before = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			const currentBalance = Number(before?.balance ?? 0);

			const response = await client.money.accounts[":id"].reconcile.$post(
				{
					param: { id: testAccountId },
					json: { actualBalance: currentBalance },
				},
				{
					headers: {
						Authorization: `Bearer ${testUser.accessToken}`,
					},
				},
			);

			expect(response.status).toBe(200);
			const result = await response.json();
			expect(result.data.noOp).toBe(true);
			expect(result.data.transaction).toBeNull();

			const after = await db.query.moneyAccounts.findFirst({
				where: eq(moneyAccounts.id, testAccountId),
			});
			expect(Number(after?.balance)).toBe(currentBalance);
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

	describe("PUT /money/accounts/:id", () => {
		test("should reject manual account balance override", async () => {
			const response = await client.money.accounts[":id"].$put(
				{
					param: { id: testAccountId },
					json: {
						balance: 999999,
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
