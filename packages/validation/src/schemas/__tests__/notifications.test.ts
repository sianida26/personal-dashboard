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

	it("validates list query filters", () => {
		const query = listNotificationsQuerySchema.parse({
			status: "unread",
			type: "approval",
			before: new Date().toISOString(),
		});

		expect(query.status).toBe("unread");
		expect(query.type).toBe("approval");
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
