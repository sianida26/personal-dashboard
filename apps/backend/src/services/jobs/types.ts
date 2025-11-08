import type appLogger from "../../utils/logger";

export type JobStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";

export type JobPriority = "critical" | "high" | "normal" | "low";

export type RetryStrategy = "exponential" | "linear" | "fixed" | "custom";

export interface CreateJobOptions<T = Record<string, unknown>> {
	type: string;
	payload: T;
	priority: JobPriority;
	scheduledAt?: Date;
	maxRetries?: number;
	timeoutSeconds?: number;
	tags?: string[];
	createdBy?: string;
}

export interface JobContext<T = Record<string, unknown>> {
	jobId: string;
	attempt: number;
	payload: T;
	priority: JobPriority;
	createdBy?: string;
	logger: typeof appLogger;
	signal: AbortSignal;
}

export interface JobResult {
	success: boolean;
	data?: unknown;
	message?: string;
	shouldRetry?: boolean;
}

export interface JobHandler<T = Record<string, unknown>> {
	type: string;
	description: string;
	defaultMaxRetries: number;
	defaultTimeoutSeconds: number;
	execute(payload: T, context: JobContext<T>): Promise<JobResult>;
	validate?(payload: unknown): T;
	onFailure?(error: Error, context: JobContext<T>): Promise<void>;
	onSuccess?(result: JobResult, context: JobContext<T>): Promise<void>;
}

export interface WorkerPoolConfig {
	maxWorkers: number;
	pollInterval: number;
	maxJobsPerWorker: number;
	workerTimeout: number;
	gracefulShutdownTimeout: number;
}

export interface RetryConfig {
	maxRetries: number;
	strategy: RetryStrategy;
	baseDelay: number;
	maxDelay: number;
	customRetryFn?: (attempt: number) => number;
}

export interface JobQueueConfig {
	maxWorkers: number;
	pollInterval: number;
	maxJobsPerWorker: number;
	workerTimeout: number;
	gracefulShutdownTimeout: number;
	defaultMaxRetries: number;
	defaultTimeoutSeconds: number;
	retryStrategy: RetryStrategy;
	retryBaseDelay: number;
	retryMaxDelay: number;
	enableMetrics: boolean;
	metricsInterval: number;
}

export interface JobMetrics {
	totalJobs: number;
	completedJobs: number;
	failedJobs: number;
	pendingJobs: number;
	processingJobs: number;
	averageExecutionTime: number;
	errorRate: number;
	queueDepth: number;
	workerUtilization: number;
}

export interface WorkerInfo {
	id: string;
	status: "idle" | "busy" | "error";
	currentJobId?: string;
	lastActivity: Date;
	jobsProcessed: number;
	errorsCount: number;
}
