/**
 * Job Worker
 *
 * Individual worker that processes jobs from the queue.
 * Each worker runs independently and can process one job at a time.
 */

import { createId } from "@paralleldrive/cuid2";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import db from "../../drizzle";
import { jobExecutions, jobs } from "../../drizzle/schema/job-queue";
import jobHandlerRegistry from "../../jobs/registry";
import { jobMetrics } from "../../utils/custom-metrics";
import appLogger from "../../utils/logger";
import { defaultJobQueueConfig, retryDelayCalculators } from "./config";
import type {
	JobContext,
	JobHandler,
	JobPriority,
	JobResult,
	WorkerInfo,
} from "./types";

// Type for database job record
type DbJob = typeof jobs.$inferSelect;
type DbJobExecution = typeof jobExecutions.$inferSelect;

/**
 * Maps numeric priority to JobPriority string
 */
function mapNumericPriorityToJobPriority(priority: number): JobPriority {
	switch (priority) {
		case 0:
			return "critical";
		case 1:
			return "high";
		case 2:
			return "normal";
		case 3:
			return "low";
		default:
			return "normal";
	}
}

export class JobWorker {
	private id: string;
	private isRunning = false;
	private currentJobId: string | null = null;
	private abortController: AbortController | null = null;
	private lastActivity: Date = new Date();
	private jobsProcessed = 0;
	private errorsCount = 0;

	constructor(id?: string) {
		this.id = id || createId();
	}

	/**
	 * Start the worker
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			appLogger.debug(`Worker ${this.id} is already running`);
			return;
		}

		this.isRunning = true;
		appLogger.info(`Worker ${this.id} started`);

		// Start the main worker loop
		this.run().catch((error) => {
			appLogger.error(
				error instanceof Error ? error : new Error(String(error)),
			);
			this.isRunning = false;
		});
	}

	/**
	 * Stop the worker
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;

		// Cancel current job if any
		if (this.abortController) {
			this.abortController.abort();
		}

		appLogger.info(`Worker ${this.id} stopped`);
	}

	/**
	 * Main worker loop
	 */
	private async run(): Promise<void> {
		while (this.isRunning) {
			try {
				await this.processNextJob();
				this.lastActivity = new Date();
			} catch (error) {
				appLogger.error(
					error instanceof Error ? error : new Error(String(error)),
				);
				this.errorsCount++;
			}

			// Wait before next poll
			if (this.isRunning) {
				await this.sleep(defaultJobQueueConfig.pollInterval);
			}
		}
	}

	/**
	 * Process the next available job
	 */
	private async processNextJob(): Promise<void> {
		// Get next job from queue
		const job = await this.getNextJob();
		if (!job) {
			return;
		}

		this.currentJobId = job.id;
		this.abortController = new AbortController();

		try {
			// Get job handler
			const handler = jobHandlerRegistry.get(job.type);
			if (!handler) {
				throw new Error(
					`No handler registered for job type: ${job.type}`,
				);
			}

			// Create job execution record
			const execution = await this.createJobExecution(
				job.id,
				job.retryCount + 1,
			);
			if (!execution) {
				throw new Error(
					`Failed to create job execution record for job ${job.id}`,
				);
			}

			// Note: Job status is already updated to "processing" in getNextJob()
			// within the same transaction that claimed the job

			// Validate payload if handler has validation
			let validatedPayload: Record<string, unknown> =
				(job.payload as Record<string, unknown>) || {};
			if (handler.validate) {
				const validated = handler.validate(job.payload);
				validatedPayload = validated as Record<string, unknown>;
			}

			// Create job context with all required fields
			const context: JobContext = {
				jobId: job.id,
				attempt: job.retryCount + 1,
				payload: validatedPayload,
				priority: mapNumericPriorityToJobPriority(job.priority),
				createdBy: job.createdBy || undefined,
				logger: appLogger,
				signal: this.abortController.signal,
			};

			// Execute job with timeout
			const timeoutMs =
				(job.timeoutSeconds ||
					defaultJobQueueConfig.defaultTimeoutSeconds) * 1000;
			const result = (await this.executeWithTimeout(
				() => handler.execute(validatedPayload, context),
				timeoutMs,
			)) as JobResult;

			// Handle job completion
			if (result.success) {
				await this.handleJobSuccess(
					job,
					execution,
					result,
					handler,
					context,
				);
			} else {
				await this.handleJobFailure(
					job,
					execution,
					result,
					handler,
					context,
				);
			}

			this.jobsProcessed++;
		} catch (error) {
			await this.handleJobError(job, error as Error);
			this.errorsCount++;
		} finally {
			this.currentJobId = null;
			this.abortController = null;
		}
	}

	/**
	 * Get next job from queue
	 * Uses FOR UPDATE SKIP LOCKED to prevent multiple workers from picking the same job
	 */
	private async getNextJob() {
		const now = new Date();

		// Use a transaction with FOR UPDATE SKIP LOCKED to atomically claim a job
		// This prevents race conditions where multiple workers pick the same job
		const result = await db.transaction(async (tx) => {
			const [job] = await tx
				.select()
				.from(jobs)
				.where(
					and(
						eq(jobs.status, "pending"),
						or(isNull(jobs.scheduledAt), lte(jobs.scheduledAt, now)),
					),
				)
				.orderBy(jobs.priority, jobs.createdAt)
				.limit(1)
				.for("update", { skipLocked: true });

			if (!job) {
				return null;
			}

			// Immediately update the job to processing within the same transaction
			// This ensures no other worker can pick it up
			await tx
				.update(jobs)
				.set({
					status: "processing",
					startedAt: new Date(),
					workerId: this.id,
					updatedAt: new Date(),
				})
				.where(eq(jobs.id, job.id));

			return job;
		});

		return result;
	}

	/**
	 * Create job execution record
	 */
	private async createJobExecution(jobId: string, attemptNumber: number) {
		const [execution] = await db
			.insert(jobExecutions)
			.values({
				jobId,
				attemptNumber,
				status: "processing",
				startedAt: new Date(),
				workerId: this.id,
			})
			.returning();

		return execution;
	}

	/**
	 * Execute job with timeout
	 */
	private async executeWithTimeout<T>(
		fn: () => Promise<T>,
		timeoutMs: number,
	): Promise<T> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(
					new Error(`Job execution timed out after ${timeoutMs}ms`),
				);
			}, timeoutMs);

			fn()
				.then(resolve)
				.catch(reject)
				.finally(() => clearTimeout(timeout));
		});
	}

	/**
	 * Handle successful job completion
	 */
	private async handleJobSuccess(
		job: DbJob,
		execution: DbJobExecution,
		result: JobResult,
		handler: JobHandler,
		context: JobContext,
	): Promise<void> {
		const now = new Date();
		const executionTimeMs = now.getTime() - execution.startedAt.getTime();

		// Track job completion
		jobMetrics.jobsCompleted.add(1, {
			job_type: job.type,
		});
		jobMetrics.jobDuration.record(executionTimeMs, {
			job_type: job.type,
		});

		// Update job status
		await db
			.update(jobs)
			.set({
				status: "completed",
				completedAt: now,
				updatedAt: now,
			})
			.where(eq(jobs.id, job.id));

		// Update execution record
		await db
			.update(jobExecutions)
			.set({
				status: "completed",
				completedAt: now,
				executionTimeMs,
			})
			.where(eq(jobExecutions.id, execution.id));

		// Call handler success callback
		if (handler.onSuccess) {
			try {
				await handler.onSuccess(result, context);
			} catch (error) {
				appLogger.error(
					error instanceof Error ? error : new Error(String(error)),
				);
			}
		}

		appLogger.info(`Job ${job.id} completed successfully`);
	}

	/**
	 * Handle job failure
	 */
	private async handleJobFailure(
		job: DbJob,
		execution: DbJobExecution,
		result: JobResult,
		handler: JobHandler,
		context: JobContext,
	): Promise<void> {
		const now = new Date();
		const executionTimeMs = now.getTime() - execution.startedAt.getTime();

		// Track job failure if no retries left
		if (
			!(result.shouldRetry !== false && job.retryCount < job.maxRetries)
		) {
			jobMetrics.jobsFailed.add(1, {
				job_type: job.type,
			});
		}

		// Update execution record
		await db
			.update(jobExecutions)
			.set({
				status: "failed",
				completedAt: now,
				executionTimeMs,
				errorMessage: result.message || "Job failed",
			})
			.where(eq(jobExecutions.id, execution.id));

		// Check if should retry
		if (result.shouldRetry !== false && job.retryCount < job.maxRetries) {
			// Calculate retry delay
			const retryDelay = this.calculateRetryDelay(job.retryCount + 1);
			const scheduledAt = new Date(Date.now() + retryDelay);

			// Update job for retry
			await db
				.update(jobs)
				.set({
					status: "pending",
					retryCount: job.retryCount + 1,
					scheduledAt,
					updatedAt: now,
					errorMessage: result.message || "Job failed",
				})
				.where(eq(jobs.id, job.id));

			appLogger.info(
				`Job ${job.id} scheduled for retry ${job.retryCount + 1}/${job.maxRetries} in ${retryDelay}ms`,
			);
		} else {
			// Mark job as failed
			await db
				.update(jobs)
				.set({
					status: "failed",
					failedAt: now,
					updatedAt: now,
					errorMessage: result.message || "Job failed",
				})
				.where(eq(jobs.id, job.id));

			const errorMsg = new Error(
				`Job ${job.id} failed permanently after ${job.retryCount} retries`,
			);
			appLogger.error(errorMsg);
		}

		// Call handler failure callback
		if (handler.onFailure) {
			try {
				const error = new Error(result.message || "Job failed");
				await handler.onFailure(error, context);
			} catch (error) {
				appLogger.error(
					error instanceof Error ? error : new Error(String(error)),
				);
			}
		}
	}

	/**
	 * Handle job error
	 */
	private async handleJobError(job: DbJob, error: Error): Promise<void> {
		const now = new Date();

		// Track job failure if no retries left
		if (job.retryCount >= job.maxRetries) {
			jobMetrics.jobsFailed.add(1, {
				job_type: job.type,
				error_type: error.constructor.name,
			});
		}

		// Check if should retry
		if (job.retryCount < job.maxRetries) {
			// Calculate retry delay
			const retryDelay = this.calculateRetryDelay(job.retryCount + 1);
			const scheduledAt = new Date(Date.now() + retryDelay);

			// Update job for retry
			await db
				.update(jobs)
				.set({
					status: "pending",
					retryCount: job.retryCount + 1,
					scheduledAt,
					updatedAt: now,
					errorMessage: error.message,
				})
				.where(eq(jobs.id, job.id));

			appLogger.error(
				new Error(
					`Job ${job.id} error, scheduled for retry ${job.retryCount + 1}/${job.maxRetries}: ${error.message}`,
				),
			);
		} else {
			// Mark job as failed
			await db
				.update(jobs)
				.set({
					status: "failed",
					failedAt: now,
					updatedAt: now,
					errorMessage: error.message,
				})
				.where(eq(jobs.id, job.id));

			appLogger.error(
				new Error(`Job ${job.id} failed permanently: ${error.message}`),
			);
		}
	}

	/**
	 * Calculate retry delay
	 */
	private calculateRetryDelay(attempt: number): number {
		const strategy = defaultJobQueueConfig.retryStrategy;
		const calculator =
			retryDelayCalculators[
				strategy as keyof typeof retryDelayCalculators
			];
		if (calculator) {
			return calculator(
				attempt,
				defaultJobQueueConfig.retryBaseDelay,
				defaultJobQueueConfig.retryMaxDelay,
			);
		}
		return defaultJobQueueConfig.retryBaseDelay;
	}

	/**
	 * Sleep for specified milliseconds
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Get worker info
	 */
	getInfo(): WorkerInfo {
		return {
			id: this.id,
			status: this.currentJobId ? "busy" : "idle",
			currentJobId: this.currentJobId || undefined,
			lastActivity: this.lastActivity,
			jobsProcessed: this.jobsProcessed,
			errorsCount: this.errorsCount,
		};
	}
}
