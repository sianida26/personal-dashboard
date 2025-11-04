import { describe, expect, it } from "bun:test";
import {
	bulkMarkNotificationsSchema,
	createNotificationSchema,
	listNotificationsQuerySchema,
	notificationActionExecutionSchema,
} from "../notifications";

describe("notifications validation schemas", () => {
	it("parses creation payloads with defaults", () => {
		const payload = createNotificationSchema.parse({
			userId: "user_123",
			type: "informational",
			title: "Hello",
			message: "World",
			category: "general",
		});

		expect(payload.status).toBe("unread");
		expect(payload.metadata).toEqual({});
	});

	it("supports role-based audiences", () => {
		const payload = createNotificationSchema.parse({
			roleCodes: ["sales"],
			type: "informational",
			title: "Pricing update",
			message: "Margin adjusted",
			category: "general",
		});

		expect(payload.roleCodes).toContain("sales");
		expect(payload.category).toBe("general");
	});

	it("accepts channel overrides and preference controls", () => {
		const payload = createNotificationSchema.parse({
			userId: "user_123",
			type: "informational",
			title: "Ops alert",
			message: "Check system",
			category: "system",
			channels: ["whatsapp", "email"],
			respectPreferences: false,
			channelOverrides: {
				email: {
					to: "ops@example.com",
					subject: "Override subject",
				},
				whatsapp: {
					phoneNumber: "+15555550100",
					message: "Override message",
				},
			},
		});

		expect(payload.channels).toEqual(["whatsapp", "email"]);
		expect(payload.respectPreferences).toBe(false);
		expect(payload.channelOverrides?.whatsapp?.phoneNumber).toBe(
			"+15555550100",
		);
	});

	it("requires at least one recipient", () => {
		expect(() =>
			createNotificationSchema.parse({
				type: "informational",
				title: "Hello",
				message: "World",
			}),
		).toThrow();
	});

	it("validates list query filters", () => {
		const query = listNotificationsQuerySchema.parse({
			status: "unread",
			type: "approval",
			category: "orders",
			before: new Date().toISOString(),
		});

		expect(query.status).toBe("unread");
		expect(query.type).toBe("approval");
		expect(query.category).toBe("orders");
	});

	it("rejects bulk mark payload without ids", () => {
		expect(() =>
			bulkMarkNotificationsSchema.parse({
				ids: [],
				markAs: "read",
			}),
		).toThrow();
	});

	it("trims optional action comments", () => {
		const payload = notificationActionExecutionSchema.parse({
			notificationId: "clg1w8c0y0000s5nw3zrb8f0p",
			actionKey: "approve",
			comment: "  looks good  ",
		});

		expect(payload.comment).toBe("looks good");
	});
});
