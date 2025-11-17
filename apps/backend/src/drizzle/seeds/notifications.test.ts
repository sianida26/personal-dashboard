import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "..";
import {
	notificationActionLogs,
	notificationActions,
	notifications,
} from "../schema/notifications";
import { rolesSchema } from "../schema/roles";
import { rolesToUsers } from "../schema/rolesToUsers";
import { users } from "../schema/users";
import notificationsSeeder from "./notifications";

describe("Notifications Seeder", () => {
	beforeEach(async () => {
		// Clean up test data before each test
		await db.delete(notificationActionLogs);
		await db.delete(notificationActions);
		await db.delete(notifications);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	afterEach(async () => {
		// Clean up test data after each test
		await db.delete(notificationActionLogs);
		await db.delete(notificationActions);
		await db.delete(notifications);
		await db.delete(rolesToUsers);
		await db.delete(users);
		await db.delete(rolesSchema);
	});

	test("should seed notifications when none exist", async () => {
		// Create required role and user first
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		// Verify notifications were inserted
		const insertedNotifications = await db.select().from(notifications);

		expect(insertedNotifications.length).toBeGreaterThan(0);
		expect(insertedNotifications).toHaveLength(3);

		// Verify notification details
		const welcomeNotification = insertedNotifications.find((n) =>
			n.title.includes("Welcome"),
		);
		expect(welcomeNotification).toBeDefined();
		expect(welcomeNotification?.type).toBe("informational");
		expect(welcomeNotification?.status).toBe("unread");
		expect(welcomeNotification?.userId).toBe(user.id);

		const approvalNotification = insertedNotifications.find((n) =>
			n.title.includes("Purchase order"),
		);
		expect(approvalNotification).toBeDefined();
		expect(approvalNotification?.type).toBe("approval");
		expect(approvalNotification?.category).toBe("approvals");
	});

	test("should seed notification actions along with approval notifications", async () => {
		// Create required role and user first
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		// Verify actions were created
		const actions = await db.select().from(notificationActions);

		expect(actions.length).toBeGreaterThan(0);

		// Check for approve and request_changes actions
		const approveAction = actions.find((a) => a.actionKey === "approve");
		const requestChangesAction = actions.find(
			(a) => a.actionKey === "request_changes",
		);

		expect(approveAction).toBeDefined();
		expect(approveAction?.label).toBe("Approve");
		expect(approveAction?.requiresComment).toBe(false);

		expect(requestChangesAction).toBeDefined();
		expect(requestChangesAction?.label).toBe("Request Changes");
		expect(requestChangesAction?.requiresComment).toBe(true);
	});

	test("should handle existing notifications gracefully", async () => {
		// Create required role and user first
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run seeder first time
		await notificationsSeeder();

		const notificationsAfterFirstRun = await db
			.select()
			.from(notifications);
		const actionsAfterFirstRun = await db
			.select()
			.from(notificationActions);

		// Run seeder second time
		await notificationsSeeder();

		const notificationsAfterSecondRun = await db
			.select()
			.from(notifications);
		const actionsAfterSecondRun = await db
			.select()
			.from(notificationActions);

		// Should not create duplicates
		expect(notificationsAfterSecondRun).toHaveLength(
			notificationsAfterFirstRun.length,
		);
		expect(actionsAfterSecondRun).toHaveLength(actionsAfterFirstRun.length);
	});

	test("should skip seeding if user superadmin does not exist", async () => {
		// Don't create any users

		// Run the seeder - should return early
		await notificationsSeeder();

		// Verify no notifications were created
		const insertedNotifications = await db.select().from(notifications);
		expect(insertedNotifications).toHaveLength(0);
	});

	test("should skip seeding if notifications already exist", async () => {
		// Create required role and user
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		// Manually insert a notification
		await db.insert(notifications).values({
			userId: user.id,
			type: "informational",
			title: "Existing Notification",
			message: "This already exists",
			status: "unread",
		});

		// Run the seeder - should return early
		await notificationsSeeder();

		// Verify no additional notifications were created
		const allNotifications = await db.select().from(notifications);
		expect(allNotifications).toHaveLength(1);
		expect(allNotifications[0]?.title).toBe("Existing Notification");
	});

	test("should create notifications with correct metadata", async () => {
		// Create required role and user
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		// Check metadata
		const notificationsWithMetadata = await db.select().from(notifications);

		const welcomeNotif = notificationsWithMetadata.find((n) =>
			n.title.includes("Welcome"),
		);
		expect(welcomeNotif?.metadata).toHaveProperty("linkLabel");
		expect(welcomeNotif?.metadata).toHaveProperty("linkHref");

		const approvalNotif = notificationsWithMetadata.find((n) =>
			n.title.includes("Purchase order"),
		);
		expect(approvalNotif?.metadata).toHaveProperty("resourceType");
		expect(approvalNotif?.metadata).toHaveProperty("resourceId");

		const securityNotif = notificationsWithMetadata.find((n) =>
			n.title.includes("security scan"),
		);
		expect(securityNotif?.metadata).toHaveProperty("priority");
	});

	test("should create notifications with different timestamps", async () => {
		// Create required role and user
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		const notifs = await db.select().from(notifications);

		// Verify different creation times (seeder creates them with different timestamps)
		const timestamps = notifs.map((n) => n.createdAt.getTime());
		const uniqueTimestamps = new Set(timestamps);

		// Should have different timestamps
		expect(uniqueTimestamps.size).toBeGreaterThan(1);
	});

	test("should set readAt for read notifications", async () => {
		// Create required role and user
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		const readNotifications = await db
			.select()
			.from(notifications)
			.where(eq(notifications.status, "read"));

		expect(readNotifications.length).toBeGreaterThan(0);

		// Read notifications should have readAt set
		for (const notif of readNotifications) {
			expect(notif.readAt).toBeDefined();
			expect(notif.readAt).toBeInstanceOf(Date);
		}
	});

	test("should not set readAt for unread notifications", async () => {
		// Create required role and user
		const [role] = await db
			.insert(rolesSchema)
			.values({
				code: "super-admin",
				name: "Super Admin",
				description: "Super administrator role",
			})
			.returning();

		const [user] = await db
			.insert(users)
			.values({
				name: "Super Admin",
				username: "superadmin",
				email: "superadmin@example.com",
				password: "hash",
			})
			.returning();

		if (!user || !role) throw new Error("Failed to create test data");

		await db.insert(rolesToUsers).values({
			userId: user.id,
			roleId: role.id,
		});

		// Run the seeder
		await notificationsSeeder();

		const unreadNotifications = await db
			.select()
			.from(notifications)
			.where(eq(notifications.status, "unread"));

		expect(unreadNotifications.length).toBeGreaterThan(0);

		// Unread notifications should not have readAt set
		for (const notif of unreadNotifications) {
			expect(notif.readAt).toBeNull();
		}
	});
});
