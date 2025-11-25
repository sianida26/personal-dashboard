import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import client from "../../utils/honoTestClient";
import { hashPassword } from "../../utils/passwordUtils";

const testPassword = "V7d#rL9p@Wq3zMf1";

describe("Refresh Route", () => {
	let refreshToken: string;
	let userId: string;

	beforeAll(async () => {
		await db.delete(users).where(eq(users.username, "_refresh_user"));

		const hashedPassword = await hashPassword(testPassword);
		const [created] = await db
			.insert(users)
			.values({
				name: "Refresh User",
				username: "_refresh_user",
				email: "refresh_user@example.com",
				password: hashedPassword,
				isEnabled: true,
			})
			.returning();

		if (!created) throw new Error("Failed to prepare refresh token user");

		userId = created.id;

		const loginRes = await client.auth.login.$post({
			json: {
				username: created.username,
				password: testPassword,
			},
		});

		const loginBody = await loginRes.json();
		refreshToken = loginBody.refreshToken;
	});

	afterAll(async () => {
		await db.delete(users).where(eq(users.id, userId));
	});

	test("should return same refresh token and a new access token (supports multiple tabs/devices)", async () => {
		const res = await client.auth.refresh.$post({
			json: {
				refreshToken,
			},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("accessToken");
		expect(body).toHaveProperty("refreshToken");
		// Same refresh token is returned (no rotation)
		expect(body.refreshToken).toBe(refreshToken);

		// Second attempt with same token should also work (multiple tabs/devices support)
		const secondAttempt = await client.auth.refresh.$post({
			json: {
				refreshToken,
			},
		});

		expect(secondAttempt.status).toBe(200);
		const secondBody = await secondAttempt.json();
		expect(secondBody).toHaveProperty("accessToken");
		expect(secondBody.refreshToken).toBe(refreshToken);
	});
});
