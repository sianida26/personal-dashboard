import { beforeEach, describe, expect, it } from "bun:test";
import type { NotificationRecord } from "../../src/drizzle/schema/notifications";
import { NotificationEventHub } from "../../src/lib/event-bus/notification-event-hub";

describe("NotificationEventHub", () => {
	let hub: NotificationEventHub;

	beforeEach(() => {
		hub = new NotificationEventHub();
	});

	describe("on/emit/off", () => {
		it("should register and trigger event listeners", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			hub.on("read", listener);
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});

			expect(payloads).toHaveLength(1);
			expect(payloads[0]).toMatchObject({
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});
		});

		it("should remove listener with off", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			hub.on("read", listener);
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});
			expect(payloads).toHaveLength(1);

			hub.off("read", listener);
			hub.emit("read", {
				userId: "user-2",
				ids: ["notif-2"],
				status: "read",
			});
			expect(payloads).toHaveLength(1); // Still 1, not 2
		});

		it("should remove listener with returned unsubscribe function", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			const unsubscribe = hub.on("read", listener);
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});
			expect(payloads).toHaveLength(1);

			unsubscribe();
			hub.emit("read", {
				userId: "user-2",
				ids: ["notif-2"],
				status: "read",
			});
			expect(payloads).toHaveLength(1); // Still 1
		});
	});

	describe("once", () => {
		it("should trigger listener only once", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			hub.once("read", listener);
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});
			hub.emit("read", {
				userId: "user-2",
				ids: ["notif-2"],
				status: "read",
			});

			expect(payloads).toHaveLength(1);
		});

		it("should return unsubscribe function", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			const unsubscribe = hub.once("read", listener);
			unsubscribe();
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});

			expect(payloads).toHaveLength(0);
		});
	});

	describe("onCreatedForUser", () => {
		it("should trigger listener for matching user", () => {
			const payloads: NotificationRecord[] = [];
			const listener = (payload: NotificationRecord) => {
				payloads.push(payload);
			};

			hub.onCreatedForUser("user-1", listener);

			const notification: NotificationRecord = {
				id: "notif-1",
				userId: "user-1",
				type: "informational",
				title: "Test",
				message: "Test message",
				metadata: {},
				status: "unread",
				category: "general",
				createdAt: new Date(),
				readAt: null,
				expiresAt: null,
				groupKey: null,
			};

			hub.emit("created", notification);

			expect(payloads).toHaveLength(1);
			expect(payloads[0]?.userId).toBe("user-1");
		});

		it("should not trigger listener for different user", () => {
			const payloads: NotificationRecord[] = [];
			const listener = (payload: NotificationRecord) => {
				payloads.push(payload);
			};

			hub.onCreatedForUser("user-1", listener);

			const notification: NotificationRecord = {
				id: "notif-1",
				userId: "user-2", // Different user
				type: "informational",
				title: "Test",
				message: "Test message",
				metadata: {},
				status: "unread",
				category: "general",
				createdAt: new Date(),
				readAt: null,
				expiresAt: null,
				groupKey: null,
			};

			hub.emit("created", notification);

			expect(payloads).toHaveLength(0);
		});

		it("should remove listener with returned unsubscribe function", () => {
			const payloads: NotificationRecord[] = [];
			const listener = (payload: NotificationRecord) => {
				payloads.push(payload);
			};

			const unsubscribe = hub.onCreatedForUser("user-1", listener);

			const notification: NotificationRecord = {
				id: "notif-1",
				userId: "user-1",
				type: "informational",
				title: "Test",
				message: "Test message",
				metadata: {},
				status: "unread",
				category: "general",
				createdAt: new Date(),
				readAt: null,
				expiresAt: null,
				groupKey: null,
			};

			hub.emit("created", notification);
			expect(payloads).toHaveLength(1);

			unsubscribe();
			hub.emit("created", { ...notification, id: "notif-2" });
			expect(payloads).toHaveLength(1); // Still 1
		});

		it("should handle multiple listeners for same user", () => {
			const payloads1: NotificationRecord[] = [];
			const payloads2: NotificationRecord[] = [];

			const listener1 = (payload: NotificationRecord) => {
				payloads1.push(payload);
			};
			const listener2 = (payload: NotificationRecord) => {
				payloads2.push(payload);
			};

			hub.onCreatedForUser("user-1", listener1);
			hub.onCreatedForUser("user-1", listener2);

			const notification: NotificationRecord = {
				id: "notif-1",
				userId: "user-1",
				type: "informational",
				title: "Test",
				message: "Test message",
				metadata: {},
				status: "unread",
				category: "general",
				createdAt: new Date(),
				readAt: null,
				expiresAt: null,
				groupKey: null,
			};

			hub.emit("created", notification);

			expect(payloads1).toHaveLength(1);
			expect(payloads2).toHaveLength(1);
		});
	});

	describe("removeAllListeners", () => {
		it("should remove all event listeners", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			hub.on("read", listener);
			hub.onCreatedForUser(
				"user-1",
				listener as (payload: NotificationRecord) => void,
			);

			hub.removeAllListeners();

			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});

			const notification: NotificationRecord = {
				id: "notif-1",
				userId: "user-1",
				type: "informational",
				title: "Test",
				message: "Test message",
				metadata: {},
				status: "unread",
				category: "general",
				createdAt: new Date(),
				readAt: null,
				expiresAt: null,
				groupKey: null,
			};

			hub.emit("created", notification);

			expect(payloads).toHaveLength(0);
		});
	});

	describe("async listeners", () => {
		it("should handle async listeners", async () => {
			const payloads: unknown[] = [];
			const listener = async (payload: unknown) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				payloads.push(payload);
			};

			hub.on("read", listener);
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(payloads).toHaveLength(1);
		});

		it("should handle async errors with error listener", async () => {
			const errors: unknown[] = [];
			const errorListener = (error: unknown) => {
				errors.push(error);
			};

			// Register error listener first
			hub.on("error" as "read", errorListener as () => void);

			const listener = async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				throw new Error("Async error");
			};

			hub.on("read", listener);

			// Should not throw
			hub.emit("read", {
				userId: "user-1",
				ids: ["notif-1"],
				status: "read",
			});

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 20));

			// Error should be caught and emitted
			expect(errors).toHaveLength(1);
		});
	});

	describe("actioned event", () => {
		it("should emit and receive actioned event", () => {
			const payloads: unknown[] = [];
			const listener = (payload: unknown) => {
				payloads.push(payload);
			};

			hub.on("actioned", listener);
			hub.emit("actioned", {
				id: "log-1",
				notificationId: "notif-1",
				actionKey: "approve",
				actedBy: "user-1",
				comment: null,
				actedAt: new Date(),
			});

			expect(payloads).toHaveLength(1);
		});
	});
});
