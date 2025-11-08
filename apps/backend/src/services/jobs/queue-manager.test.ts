import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { JobQueueManager } from "./queue-manager";
import type { CreateJobOptions } from "./types";

describe("JobQueueManager", () => {
	let jobQueueManager: JobQueueManager;

	beforeEach(async () => {
		// Create a new instance for each test
		jobQueueManager = new JobQueueManager();
		await jobQueueManager.initialize();
	});

	afterEach(async () => {
		// Clean up after tests
		await jobQueueManager.shutdown();
	});

	it("should create a job with valid type", async () => {
		const jobOptions: CreateJobOptions = {
			type: "email-notification",
			payload: {
				userId: "test-user",
				template: "welcome",
			},
			priority: "normal",
		};

		const jobId = await jobQueueManager.createJob(jobOptions);
		expect(jobId).toBeDefined();
		expect(typeof jobId).toBe("string");

		// Verify job was created in database
		const job = await jobQueueManager.getJob(jobId);
		expect(job).toBeDefined();
		expect(job?.type).toBe("email-notification");
		expect(job?.status).toBe("pending");
	});

	it("should reject job with invalid type", async () => {
		const jobOptions: CreateJobOptions = {
			type: "invalid-type",
			payload: {},
			priority: "normal",
		};

		await expect(jobQueueManager.createJob(jobOptions)).rejects.toThrow(
			"Invalid job type: invalid-type",
		);
	});

	it("should get jobs with filtering", async () => {
		// Create multiple jobs
		await jobQueueManager.createJob({
			type: "email-notification",
			payload: { userId: "test-user", template: "welcome" },
			priority: "normal",
		});

		await jobQueueManager.createJob({
			type: "data-processing",
			payload: { numbers: [1, 2, 3], operation: "sum" },
			priority: "normal",
		});

		// Get all jobs
		const allJobs = await jobQueueManager.getJobs();
		expect(allJobs.length).toBeGreaterThanOrEqual(2);

		// Filter by type
		const emailJobs = await jobQueueManager.getJobs({
			type: "email-notification",
		});
		expect(emailJobs.length).toBeGreaterThanOrEqual(1);
		expect(
			emailJobs.every((job) => job.type === "email-notification"),
		).toBe(true);

		// Filter by status
		const pendingJobs = await jobQueueManager.getJobs({
			status: "pending",
		});
		expect(pendingJobs.length).toBeGreaterThanOrEqual(2);
		expect(pendingJobs.every((job) => job.status === "pending")).toBe(true);
	});

	it("should cancel a pending job", async () => {
		// Create a job scheduled for future to ensure it stays pending
		const futureDate = new Date(Date.now() + 300000); // 5 minutes in future
		const jobId = await jobQueueManager.createJob({
			type: "email-notification",
			payload: { userId: "user1", template: "welcome" },
			scheduledAt: futureDate,
			priority: "normal",
		});

		// Wait a moment to ensure job is created
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Check job status before cancellation
		const jobBeforeCancel = await jobQueueManager.getJob(jobId);
		expect(jobBeforeCancel?.status).toBe("pending");

		// Cancel the job
		const cancelled = await jobQueueManager.cancelJob(jobId);
		expect(cancelled).toBe(true);

		// Check job status after cancellation
		const jobAfterCancel = await jobQueueManager.getJob(jobId);
		expect(jobAfterCancel?.status).toBe("cancelled");
	});
});
