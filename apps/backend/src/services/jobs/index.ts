/**
 * Jobs Module
 *
 * Main entry point for the job queue system. Exports all services,
 * configuration, registry, and types for use throughout the application.
 */

export type {
	JobPriority,
	RetryStrategy,
} from "./config";
// Configuration
export {
	defaultJobQueueConfig,
	jobPriorityMapping,
	retryDelayCalculators,
} from "./config";
// Core services
// Default instances
export {
	default as jobQueueManager,
	JobQueueManager,
} from "./queue-manager";
// Types
export type * from "./types";
export { JobWorker } from "./worker";
export { WorkerPool } from "./worker-pool";
