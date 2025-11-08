import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "../../src/modules/notifications/channels/types";
import { UnifiedNotificationService } from "../../src/modules/notifications/unified-notification-service";
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

		// Reset all preferences to default state before tests
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
				{ category: "global", channel: "inApp", enabled: true },
				{ category: "global", channel: "whatsapp", enabled: true },
				{ category: "system", channel: "email", enabled: true },
				{ category: "system", channel: "inApp", enabled: true },
				{ category: "system", channel: "whatsapp", enabled: true },
				{ category: "general", channel: "email", enabled: true },
				{ category: "general", channel: "inApp", enabled: true },
				{ category: "general", channel: "whatsapp", enabled: true },
			],
		});
	});

	afterEach(async () => {
		// Reset all preferences to default state
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
				{ category: "global", channel: "inApp", enabled: true },
				{ category: "global", channel: "whatsapp", enabled: true },
				{ category: "system", channel: "email", enabled: true },
				{ category: "system", channel: "inApp", enabled: true },
				{ category: "system", channel: "whatsapp", enabled: true },
				{ category: "general", channel: "email", enabled: true },
				{ category: "general", channel: "inApp", enabled: true },
				{ category: "general", channel: "whatsapp", enabled: true },
			],
		});
	});

	afterAll(async () => {
		// reset all preferences to default true
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
				{ category: "global", channel: "inApp", enabled: true },
				{ category: "global", channel: "whatsapp", enabled: true },
				{ category: "system", channel: "email", enabled: true },
				{ category: "system", channel: "inApp", enabled: true },
				{ category: "system", channel: "whatsapp", enabled: true },
				{ category: "general", channel: "email", enabled: true },
				{ category: "general", channel: "inApp", enabled: true },
				{ category: "general", channel: "whatsapp", enabled: true },
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
				{ category: "general", channel: "email", enabled: false },
				{ category: "general", channel: "inApp", enabled: true },
				{ category: "general", channel: "whatsapp", enabled: true },
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
			category: "general",
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

	it("global preference disabled overrides specific category preference enabled", async () => {
		// Set global email to false, but general email to true
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: false },
				{ category: "general", channel: "email", enabled: true },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "general",
			title: "Global Override Test",
			message: "Testing global preference override",
			channels: ["email"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "skipped",
			reason: expect.stringContaining("preference"),
		});
	});

	it("global preference enabled allows specific category preference enabled", async () => {
		// Set global email to true and general email to true
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
				{ category: "general", channel: "email", enabled: true },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "general",
			title: "Global Enabled Test",
			message: "Testing global enabled with category enabled",
			channels: ["email"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "sent",
		});
	});

	it("specific category preference disabled works when global is enabled", async () => {
		// Set global email to true but general email to false
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
				{ category: "general", channel: "email", enabled: false },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "general",
			title: "Category Override Test",
			message: "Testing category preference disabled",
			channels: ["email"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "skipped",
			reason: expect.stringContaining("preference"),
		});
	});

	it("uses global preference when no category-specific preference exists", async () => {
		// Set only global email preference
		await notificationPreferenceService.updateUserPreferences(userId, {
			preferences: [
				{ category: "global", channel: "email", enabled: true },
			],
		});

		service = new UnifiedNotificationService({
			adapters: [new StubAdapter("email")],
		});

		const result = await service.sendNotification({
			userIds: [userId],
			category: "system",
			title: "Global Fallback Test",
			message: "Testing global as fallback",
			channels: ["email"],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0]).toMatchObject({
			userId,
			channel: "email",
			status: "sent",
		});
	});
});
