/**
 * Job Queue Manager
 *
 * Main service for managing the job queue. Handles job creation,
 * querying, cancellation, and provides health/metrics information.
 */

import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, eq } from "drizzle-orm";
import db from "../../drizzle";
import { jobExecutions, jobs } from "../../drizzle/schema/job-queue";
import jobHandlerRegistry from "../../jobs/registry";
import { jobMetrics } from "../../utils/custom-metrics";
import appLogger from "../../utils/logger";
import { jobPriorityMapping } from "./config";
import type { CreateJobOptions, JobMetrics, JobStatus } from "./types";
import { WorkerPool } from "./worker-pool";

export class JobQueueManager {
	private workerPool: WorkerPool;
	private isInitialized = false;

	constructor() {
		this.workerPool = new WorkerPool();
	}

	/**
	 * Initialize the job queue manager
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		appLogger.info("Initializing job queue manager");

		// Start worker pool
		await this.workerPool.start();

		this.isInitialized = true;
		appLogger.info("Job queue manager initialized");
	}

	/**
	 * Shutdown the job queue manager
	 */
	async shutdown(): Promise<void> {
		if (!this.isInitialized) {
			return;
		}

		appLogger.info("Shutting down job queue manager");

		// Stop worker pool
		await this.workerPool.stop();

		this.isInitialized = false;
		appLogger.info("Job queue manager shut down");
	}

	/**
	 * Create a new job
	 */
	async createJob(options: CreateJobOptions): Promise<string> {
		// Validate job type
		if (!jobHandlerRegistry.has(options.type)) {
			throw new Error(`Invalid job type: ${options.type}`);
		}

		// Get handler for defaults
		const handler = jobHandlerRegistry.get(options.type);
		if (!handler) {
			throw new Error(`Invalid job type: ${options.type}`);
		}

		// Generate job ID and timestamps
		const jobId = createId();
		const now = new Date();

		// Calculate priority value - ensure it's a valid key
		const priorityKey = (
			typeof options.priority === "string" ? options.priority : "normal"
		) as keyof typeof jobPriorityMapping;
		const priority =
			jobPriorityMapping[priorityKey] || jobPriorityMapping.normal;

		// Prepare job data
		const jobData = {
			id: jobId,
			type: options.type,
			payload: options.payload || {},
			status: "pending" as const,
			priority,
			retryCount: 0,
			maxRetries: options.maxRetries || handler.defaultMaxRetries,
			timeoutSeconds:
				options.timeoutSeconds || handler.defaultTimeoutSeconds,
			tags: options.tags || [],
			createdBy: options.createdBy || null,
			createdAt: now,
			updatedAt: now,
		};

		// Insert job into database
		await db.insert(jobs).values(jobData);

		// Track job enqueue
		jobMetrics.jobsEnqueued.add(1, {
			job_type: options.type,
			priority: priorityKey,
		});

		appLogger.info(`Job ${jobId} created with type ${options.type}`);
		return jobId;
	}

	/**
	 * Get job by ID
	 */
	async getJob(jobId: string) {
		const [job] = await db
			.select()
			.from(jobs)
			.where(eq(jobs.id, jobId))
			.limit(1);

		return job;
	}

	/**
	 * Get jobs with optional filtering
	 */
	async getJobs(filters?: {
		status?: JobStatus;
		type?: string;
		createdBy?: string;
		limit?: number;
		offset?: number;
	}) {
		let queryBuilder = db.select().from(jobs);

		// Apply filters
		const conditions = [];
		if (filters?.status) {
			conditions.push(eq(jobs.status, filters.status));
		}
		if (filters?.type) {
			conditions.push(eq(jobs.type, filters.type));
		}
		if (filters?.createdBy) {
			conditions.push(eq(jobs.createdBy, filters.createdBy));
		}

		if (conditions.length > 0) {
			queryBuilder = queryBuilder.where(
				and(...conditions),
			) as typeof queryBuilder;
		}

		// Apply ordering
		queryBuilder = queryBuilder.orderBy(
			desc(jobs.createdAt),
		) as typeof queryBuilder;

		// Apply pagination
		if (filters?.limit) {
			queryBuilder = queryBuilder.limit(
				filters.limit,
			) as typeof queryBuilder;
		}
		if (filters?.offset) {
			queryBuilder = queryBuilder.offset(
				filters.offset,
			) as typeof queryBuilder;
		}

		return await queryBuilder;
	}

	/**
	 * Cancel a pending job
	 */
	async cancelJob(jobId: string): Promise<boolean> {
		// First check if the job exists and is in pending state
		const existingJob = await db
			.select()
			.from(jobs)
			.where(eq(jobs.id, jobId))
			.limit(1);

		if (existingJob.length === 0) {
			appLogger.info(`Job ${jobId} not found for cancellation`);
			return false;
		}

		const job = existingJob[0];
		if (!job || job.status !== "pending") {
			appLogger.info(
				`Job ${jobId} is not in pending state (current: ${job?.status ?? "not found"})`,
			);
			return false;
		}

		try {
			const result = await db
				.update(jobs)
				.set({
					status: "cancelled",
					updatedAt: new Date(),
				})
				.where(eq(jobs.id, jobId))
				.returning({ id: jobs.id });

			if (result.length > 0) {
				appLogger.info(`Job ${jobId} cancelled successfully`);
				return true;
			}

			appLogger.info(
				`Job ${jobId} cancellation failed - no rows returned`,
			);
			return false;
		} catch (error) {
			appLogger.error(
				new Error(`Error cancelling job ${jobId}: ${error}`),
			);
			return false;
		}
	}

	/**
	 * Get job execution history
	 */
	async getJobExecutions(jobId: string) {
		return await db
			.select()
			.from(jobExecutions)
			.where(eq(jobExecutions.jobId, jobId))
			.orderBy(desc(jobExecutions.startedAt));
	}

	/**
	 * Get job queue metrics
	 */
	async getMetrics(): Promise<JobMetrics> {
		// Get job counts by status
		const jobCounts = await db
			.select({
				status: jobs.status,
				count: count(jobs.id),
			})
			.from(jobs)
			.groupBy(jobs.status);

		// Get total job count
		const [totalResult] = await db
			.select({ count: count(jobs.id) })
			.from(jobs);
		const totalJobs = Number(totalResult?.count || 0);

		// Initialize metrics
		const statusCounts = {
			pending: 0,
			processing: 0,
			completed: 0,
			failed: 0,
			cancelled: 0,
		};

		// Fill in actual counts
		for (const row of jobCounts) {
			if (row.status in statusCounts) {
				statusCounts[row.status as keyof typeof statusCounts] = Number(
					row.count,
				);
			}
		}

		// Calculate metrics
		const completedJobs = statusCounts.completed;
		const failedJobs = statusCounts.failed;
		const pendingJobs = statusCounts.pending;
		const processingJobs = statusCounts.processing;

		const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
		const workerStats = this.getWorkerStats();
		const workerUtilization =
			workerStats.totalWorkers > 0
				? (workerStats.busyWorkers / workerStats.totalWorkers) * 100
				: 0;

		return {
			totalJobs,
			completedJobs,
			failedJobs,
			pendingJobs,
			processingJobs,
			averageExecutionTime: 0, // TODO: Calculate from execution history
			errorRate,
			queueDepth: pendingJobs + processingJobs,
			workerUtilization,
		};
	}

	/**
	 * Get worker pool statistics
	 */
	getWorkerStats() {
		return this.workerPool.getStats();
	}

	/**
	 * Get registered job types
	 */
	getRegisteredTypes(): string[] {
		return jobHandlerRegistry.getTypes();
	}

	/**
	 * Health check
	 */
	async healthCheck() {
		const metrics = await this.getMetrics();
		const workerStats = this.getWorkerStats();

		return {
			status: "healthy",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			jobQueue: {
				metrics,
				workers: workerStats,
				registeredTypes: this.getRegisteredTypes(),
			},
		};
	}

	/**
	 * Check if manager is initialized
	 */
	get initialized(): boolean {
		return this.isInitialized;
	}
}

// Global queue manager instance
const jobQueueManager = new JobQueueManager();

export default jobQueueManager;
