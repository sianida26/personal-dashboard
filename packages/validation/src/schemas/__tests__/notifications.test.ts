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
			category: "pricing",
		});

		expect(payload.roleCodes).toContain("sales");
		expect(payload.category).toBe("pricing");
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
