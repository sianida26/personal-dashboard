import { beforeAll, afterAll, describe, expect, test } from "bun:test";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { hashPassword } from "../../utils/passwordUtils";
import { eq } from "drizzle-orm";
import client from "../../utils/honoTestClient";

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

	test("should rotate refresh token and return a new access token", async () => {
		const res = await client.auth.refresh.$post({
			json: {
				refreshToken,
			},
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toHaveProperty("accessToken");
		expect(body).toHaveProperty("refreshToken");
		expect(body.refreshToken).not.toBe(refreshToken);

		const secondAttempt = await client.auth.refresh.$post({
			json: {
				refreshToken,
			},
		});

		expect(secondAttempt.status).toBe(401);
	});
});
