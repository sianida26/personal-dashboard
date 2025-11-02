/**
 * Job Queue Configuration
 *
 * Centralized configuration for the job queue system including
 * worker settings, retry strategies, and timing configurations.
 */

export const defaultJobQueueConfig = {
	// Worker configuration
	maxWorkers: Number(process.env.JOB_QUEUE_MAX_WORKERS) || 5,
	pollInterval: Number(process.env.JOB_QUEUE_POLL_INTERVAL) || 1000,
	maxJobsPerWorker: Number(process.env.JOB_QUEUE_MAX_JOBS_PER_WORKER) || 10,
	workerTimeout: Number(process.env.JOB_QUEUE_WORKER_TIMEOUT) || 300000,
	gracefulShutdownTimeout:
		Number(process.env.JOB_QUEUE_GRACEFUL_SHUTDOWN_TIMEOUT) || 30000,

	// Job defaults
	defaultMaxRetries: Number(process.env.JOB_QUEUE_DEFAULT_MAX_RETRIES) || 3,
	defaultTimeoutSeconds:
		Number(process.env.JOB_QUEUE_DEFAULT_TIMEOUT_SECONDS) || 300,

	// Retry configuration
	retryStrategy:
		(process.env.JOB_QUEUE_RETRY_STRATEGY as
			| "fixed"
			| "exponential"
			| "linear") || "exponential",
	retryBaseDelay: Number(process.env.JOB_QUEUE_RETRY_BASE_DELAY) || 1000,
	retryMaxDelay: Number(process.env.JOB_QUEUE_RETRY_MAX_DELAY) || 60000,

	// Monitoring
	enableMetrics: process.env.JOB_QUEUE_ENABLE_METRICS === "true" || true,
	metricsInterval: Number(process.env.JOB_QUEUE_METRICS_INTERVAL) || 60000,
} as const;

/**
* Job priority mapping for database storage
*/
export const jobPriorityMapping = {
critical: 0,
high: 1,
normal: 2,
	low: 3,
} as const;

/**
 * Retry delay calculation strategies
 */
export const retryDelayCalculators = {
	/**
	 * Fixed delay - same delay for each retry
	 */
	fixed: (_attempt: number, baseDelay: number, maxDelay: number): number => {
		return Math.min(baseDelay, maxDelay);
	},

	/**
	 * Linear delay - increases linearly with each attempt
	 */
	linear: (attempt: number, baseDelay: number, maxDelay: number): number => {
		return Math.min(baseDelay * attempt, maxDelay);
	},

	/**
	 * Exponential backoff - doubles delay with each attempt
	 */
	exponential: (
		attempt: number,
		baseDelay: number,
		maxDelay: number,
	): number => {
		const delay = baseDelay * 2 ** (attempt - 1);
		return Math.min(delay, maxDelay);
	},
} as const;

export type RetryStrategy = keyof typeof retryDelayCalculators;
export type JobPriority = keyof typeof jobPriorityMapping;
