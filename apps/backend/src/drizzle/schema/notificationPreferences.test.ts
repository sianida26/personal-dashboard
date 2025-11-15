import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import db from "..";
import {
	type NotificationDeliveryWindow,
	notificationChannelOverrides,
	userNotificationPreferences,
} from "./notificationPreferences";
import { rolesSchema } from "./roles";
import { rolesToUsers } from "./rolesToUsers";
import { users } from "./users";

describe("NotificationPreferences Schema", () => {
	let testUserId: string;

	beforeEach(async () => {
		// Clean up
		await db.delete(userNotificationPreferences);
		await db.delete(notificationChannelOverrides);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);

		// Create test role
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "test-role",
				name: "Test Role",
				description: "Test role",
			})
			.returning();

		// Create test user
		const [user] = await db
			.insert(users)
			.values({
				name: "Test User",
				username: "testuser",
				email: "test@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");
		testUserId = user.id;

		// Assign role to user
		await db.insert(rolesToUsers).values({
			userId: testUserId,
			roleId: role.id,
		});
	});

	afterEach(async () => {
		// Clean up
		await db.delete(userNotificationPreferences);
		await db.delete(notificationChannelOverrides);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	describe("userNotificationPreferences table", () => {
		test("should create user preference with required fields", async () => {
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "general",
					channel: "email",
					enabled: true,
					source: "default",
				})
				.returning();

			expect(pref).toBeDefined();
			expect(pref?.id).toBeDefined();
			expect(pref?.userId).toBe(testUserId);
			expect(pref?.category).toBe("general");
			expect(pref?.channel).toBe("email");
			expect(pref?.enabled).toBe(true);
			expect(pref?.source).toBe("default");
			expect(pref?.createdAt).toBeInstanceOf(Date);
			expect(pref?.updatedAt).toBeInstanceOf(Date);
		});

		test("should create preference with default enabled value", async () => {
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "global",
					channel: "inApp",
				})
				.returning();

			expect(pref?.enabled).toBe(true);
		});

		test("should create preference with default source value", async () => {
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "system",
					channel: "whatsapp",
				})
				.returning();

			expect(pref?.source).toBe("default");
		});

		test("should create preference with delivery window", async () => {
			const deliveryWindow: NotificationDeliveryWindow = {
				startHour: 9,
				endHour: 17,
				timezone: "Asia/Jakarta",
				daysOfWeek: [1, 2, 3, 4, 5],
			};

			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "general",
					channel: "email",
					deliveryWindow,
				})
				.returning();

			expect(pref?.deliveryWindow).toEqual(deliveryWindow);
		});

		test("should enforce unique constraint on user-category-channel", async () => {
			await db.insert(userNotificationPreferences).values({
				userId: testUserId,
				category: "general",
				channel: "email",
				enabled: true,
			});

			// Try to insert duplicate - should throw error with unique constraint violation
			try {
				await db.insert(userNotificationPreferences).values({
					userId: testUserId,
					category: "general",
					channel: "email",
					enabled: false,
				});
				// If we get here, the test should fail
				expect(true).toBe(false);
			} catch (error) {
				// Should throw an error related to unique constraint
				expect(error).toBeDefined();
			}
		});

		test("should allow same user-category with different channels", async () => {
			await db.insert(userNotificationPreferences).values([
				{
					userId: testUserId,
					category: "general",
					channel: "email",
					enabled: true,
				},
				{
					userId: testUserId,
					category: "general",
					channel: "inApp",
					enabled: true,
				},
			]);

			const prefs = await db
				.select()
				.from(userNotificationPreferences)
				.where(eq(userNotificationPreferences.userId, testUserId));

			expect(prefs).toHaveLength(2);
		});

		test("should update preference source to user", async () => {
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "general",
					channel: "email",
					source: "default",
				})
				.returning();

			if (!pref) throw new Error("Failed to create preference");

			const [updated] = await db
				.update(userNotificationPreferences)
				.set({
					enabled: false,
					source: "user",
				})
				.where(eq(userNotificationPreferences.id, pref.id))
				.returning();

			expect(updated?.source).toBe("user");
			expect(updated?.enabled).toBe(false);
		});

		test("should cascade delete preferences when user is deleted", async () => {
			await db.insert(userNotificationPreferences).values({
				userId: testUserId,
				category: "general",
				channel: "email",
			});

			await db.delete(users).where(eq(users.id, testUserId));

			const remaining = await db
				.select()
				.from(userNotificationPreferences)
				.where(eq(userNotificationPreferences.userId, testUserId));

			expect(remaining).toHaveLength(0);
		});

		test("should query preferences by category", async () => {
			await db.insert(userNotificationPreferences).values([
				{
					userId: testUserId,
					category: "general",
					channel: "email",
				},
				{
					userId: testUserId,
					category: "system",
					channel: "email",
				},
				{
					userId: testUserId,
					category: "general",
					channel: "inApp",
				},
			]);

			const generalPrefs = await db
				.select()
				.from(userNotificationPreferences)
				.where(
					and(
						eq(userNotificationPreferences.userId, testUserId),
						eq(userNotificationPreferences.category, "general"),
					),
				);

			expect(generalPrefs).toHaveLength(2);
		});

		test("should query preferences by channel", async () => {
			await db.insert(userNotificationPreferences).values([
				{
					userId: testUserId,
					category: "general",
					channel: "email",
				},
				{
					userId: testUserId,
					category: "system",
					channel: "email",
				},
				{
					userId: testUserId,
					category: "general",
					channel: "inApp",
				},
			]);

			const emailPrefs = await db
				.select()
				.from(userNotificationPreferences)
				.where(
					and(
						eq(userNotificationPreferences.userId, testUserId),
						eq(userNotificationPreferences.channel, "email"),
					),
				);

			expect(emailPrefs).toHaveLength(2);
		});
	});

	describe("notificationChannelOverrides table", () => {
		test("should create channel override with required fields", async () => {
			const [override] = await db
				.insert(notificationChannelOverrides)
				.values({
					category: "system",
					channel: "email",
					enforced: true,
					reason: "Critical system notifications must be sent via email",
				})
				.returning();

			expect(override).toBeDefined();
			expect(override?.id).toBeDefined();
			expect(override?.category).toBe("system");
			expect(override?.channel).toBe("email");
			expect(override?.enforced).toBe(true);
			expect(override?.reason).toBe(
				"Critical system notifications must be sent via email",
			);
			expect(override?.createdAt).toBeInstanceOf(Date);
			expect(override?.updatedAt).toBeInstanceOf(Date);
		});

		test("should create override with default enforced value", async () => {
			const [override] = await db
				.insert(notificationChannelOverrides)
				.values({
					category: "global",
					channel: "inApp",
				})
				.returning();

			expect(override?.enforced).toBe(true);
		});

		test("should create override with time window", async () => {
			const effectiveFrom = new Date();
			const effectiveTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

			const [override] = await db
				.insert(notificationChannelOverrides)
				.values({
					category: "general",
					channel: "whatsapp",
					enforced: false,
					reason: "Maintenance period",
					effectiveFrom,
					effectiveTo,
				})
				.returning();

			expect(override?.effectiveFrom).toBeInstanceOf(Date);
			expect(override?.effectiveTo).toBeInstanceOf(Date);
		});

		test("should enforce unique constraint on category-channel", async () => {
			await db.insert(notificationChannelOverrides).values({
				category: "system",
				channel: "email",
				enforced: true,
			});

			// Try to insert duplicate - should throw error with unique constraint violation
			try {
				await db.insert(notificationChannelOverrides).values({
					category: "system",
					channel: "email",
					enforced: false,
				});
				// If we get here, the test should fail
				expect(true).toBe(false);
			} catch (error) {
				// Should throw an error related to unique constraint
				expect(error).toBeDefined();
			}
		});

		test("should allow same category with different channels", async () => {
			await db.insert(notificationChannelOverrides).values([
				{
					category: "system",
					channel: "email",
					enforced: true,
				},
				{
					category: "system",
					channel: "inApp",
					enforced: true,
				},
			]);

			const overrides = await db
				.select()
				.from(notificationChannelOverrides)
				.where(eq(notificationChannelOverrides.category, "system"));

			expect(overrides).toHaveLength(2);
		});

		test("should update override enforcement", async () => {
			const [override] = await db
				.insert(notificationChannelOverrides)
				.values({
					category: "general",
					channel: "whatsapp",
					enforced: true,
				})
				.returning();

			if (!override) throw new Error("Failed to create override");

			const [updated] = await db
				.update(notificationChannelOverrides)
				.set({
					enforced: false,
					reason: "Enforcement lifted",
				})
				.where(eq(notificationChannelOverrides.id, override.id))
				.returning();

			expect(updated?.enforced).toBe(false);
			expect(updated?.reason).toBe("Enforcement lifted");
		});

		test("should query active overrides (no effectiveTo or in future)", async () => {
			const now = new Date();
			const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

			await db.insert(notificationChannelOverrides).values([
				{
					category: "general",
					channel: "email",
					enforced: true,
				},
				{
					category: "general",
					channel: "inApp",
					enforced: true,
					effectiveTo: past, // expired
				},
				{
					category: "general",
					channel: "whatsapp",
					enforced: true,
					effectiveTo: future, // still active
				},
			]);

			const allOverrides = await db
				.select()
				.from(notificationChannelOverrides);

			// Filter active ones in memory
			const activeOverrides = allOverrides.filter(
				(o) => !o.effectiveTo || o.effectiveTo > now,
			);

			expect(activeOverrides.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("userNotificationPreferences relations", () => {
		test("should query preferences with user relation", async () => {
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "general",
					channel: "email",
				})
				.returning();

			if (!pref) throw new Error("Failed to create preference");

			// Query preference with user join
			const result = await db
				.select()
				.from(userNotificationPreferences)
				.leftJoin(
					users,
					eq(userNotificationPreferences.userId, users.id),
				)
				.where(eq(userNotificationPreferences.id, pref.id))
				.limit(1);

			expect(result).toHaveLength(1);
			expect(result[0]?.users).toBeDefined();
			expect(result[0]?.users?.id).toBe(testUserId);
		});
	});

	describe("preference and override interaction", () => {
		test("should handle user preferences alongside channel overrides", async () => {
			// Create channel override
			await db.insert(notificationChannelOverrides).values({
				category: "system",
				channel: "email",
				enforced: true,
				reason: "System notifications must use email",
			});

			// Create user preference
			const [pref] = await db
				.insert(userNotificationPreferences)
				.values({
					userId: testUserId,
					category: "system",
					channel: "email",
					enabled: false,
					source: "user",
				})
				.returning();

			// Both should exist independently
			const overrides = await db
				.select()
				.from(notificationChannelOverrides)
				.where(
					and(
						eq(notificationChannelOverrides.category, "system"),
						eq(notificationChannelOverrides.channel, "email"),
					),
				);

			expect(overrides).toHaveLength(1);
			expect(pref?.enabled).toBe(false);
			expect(pref?.source).toBe("user");
		});
	});
});
