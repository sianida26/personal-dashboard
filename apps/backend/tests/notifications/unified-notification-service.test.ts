import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "../../src/modules/notifications/channels/types";
import UnifiedNotificationService from "../../src/modules/notifications/unified-notification-service";
import notificationPreferenceService from "../../src/modules/notification-preferences/notification-preferences-service";
import db from "../../src/drizzle";
import { users } from "../../src/drizzle/schema/users";
import { eq } from "drizzle-orm";
import type { NotificationChannelEnum } from "@repo/validation";

class StubAdapter implements NotificationChannelAdapter {
	constructor(
		public readonly channel: NotificationChannelEnum,
		private readonly status: "sent" | "scheduled" = "sent",
	) {}

	async deliver({ recipients }: ChannelDeliveryRequest) {
		return recipients.map((recipient) => ({
			userId: recipient.userId,
			channel: this.channel,
			status: this.status,
		}));
	}
}

describe("UnifiedNotificationService", () => {
	let userId: string;
	let service: UnifiedNotificationService;

	beforeAll(async () => {
		const user = await db.query.users.findFirst({
			where: eq(users.username, "superadmin"),
		});

		if (!user) {
			throw new Error("Expected seeded superadmin user for tests");
		}

		userId = user.id;
	});

	afterEach(async () => {
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "system", channel: "email", enabled: true },
			],
		});
	});

	afterAll(async () => {
		// reset email preference to default true
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "system", channel: "email", enabled: true },
			],
		});
	});

	it("delivers in-app notifications when preferences allow", async () => {
		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("inApp")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "system",
			title: "Test",
			message: "Hello",
			channels: ["inApp"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "inApp",
			status: "sent",
		});
	});

	it("skips disabled channels based on user preferences", async () => {
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "system", channel: "email", enabled: false },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "system",
			title: "Preference Test",
			message: "Testing",
			channels: ["email"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "skipped",
		});
	});

	it("respects respectPreferences flag when false", async () => {
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "system", channel: "email", enabled: false },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "system",
			title: "Override Test",
			message: "Testing override",
			channels: ["email"],
			respectPreferences: false,
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "sent",
		});
	});

	it("handles multiple channels with mixed preferences", async () => {
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "leads", channel: "email", enabled: false },
				{ category: "leads", channel: "inApp", enabled: true },
				{ category: "leads", channel: "whatsapp", enabled: true },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [
				new StubAdapter("email"),
				new StubAdapter("inApp"),
				new StubAdapter("whatsapp"),
			],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "leads",
			title: "Multi-channel Test",
			message: "Testing multiple channels",
			channels: ["email", "inApp", "whatsapp"],
		});

		expect(result.results).toHaveLength(3);

		const emailResult = result.results.find((r) => r.channel === "email");
		expect(emailResult).toMatchObject({
			userId,
			channel: "email",
			status: "skipped",
		});

		const inAppResult = result.results.find((r) => r.channel === "inApp");
		expect(inAppResult).toMatchObject({
			userId,
			channel: "inApp",
			status: "sent",
		});

		const whatsappResult = result.results.find(
			(r) => r.channel === "whatsapp",
		);
		expect(whatsappResult).toMatchObject({
			userId,
			channel: "whatsapp",
			status: "sent",
		});
	});

	it("defaults to inApp channel when no channels specified", async () => {
		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("inApp")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "system",
			title: "Default Channel Test",
			message: "Testing default channel",
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "inApp",
			status: "sent",
		});
	});
});
