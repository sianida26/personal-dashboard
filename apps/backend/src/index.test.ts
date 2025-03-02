// index.test.ts
import { test, expect } from "bun:test";
import app from "."; // adjust the path as needed
import appEnv from "./appEnv";

test("GET /test returns 'Server is up'", async () => {
	// Create a request to the /test endpoint
	const request = new Request(`${appEnv.BASE_URL}/test`);
	const response = await app.fetch(request);

	// Ensure the status is 200
	expect(response.status).toBe(200);

	// Parse and check the JSON response
	const json = await response.json();
	expect(json).toEqual({ message: "Server is up" });
});

test("Non-existent route returns 404", async () => {
	// Create a request to a non-existent endpoint
	const request = new Request(`${appEnv.BASE_URL}/non-existent`);
	const response = await app.fetch(request);

	// The default behavior should return a 404 Not Found
	expect(response.status).toBe(404);
});
