/**
 * Worker Pool
 *
 * Manages a pool of job workers. Responsible for starting/stopping
 * workers and providing aggregated statistics.
 */

import appLogger from "../../utils/logger";
import { defaultJobQueueConfig } from "./config";
import type { WorkerInfo } from "./types";
import { JobWorker } from "./worker";

export class WorkerPool {
	private workers: JobWorker[] = [];
	private isRunning = false;

	/**
	 * Start the worker pool
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;

		// Create and start workers
		for (let i = 0; i < defaultJobQueueConfig.maxWorkers; i++) {
			const worker = new JobWorker();
			this.workers.push(worker);
			await worker.start();
		}

		appLogger.info(
			`Worker pool started with ${this.workers.length} workers`,
		);
	}

	/**
	 * Stop the worker pool
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		this.isRunning = false;

		// Stop all workers
		await Promise.all(this.workers.map((worker) => worker.stop()));
		this.workers = [];

		appLogger.info("Worker pool stopped");
	}

	/**
	 * Get worker pool info
	 */
	getInfo(): WorkerInfo[] {
		return this.workers.map((worker) => worker.getInfo());
	}

	/**
	 * Get worker pool stats
	 */
	getStats() {
		const workerInfo = this.getInfo();
		return {
			totalWorkers: workerInfo.length,
			busyWorkers: workerInfo.filter((w) => w.status === "busy").length,
			idleWorkers: workerInfo.filter((w) => w.status === "idle").length,
			totalJobsProcessed: workerInfo.reduce(
				(sum, w) => sum + w.jobsProcessed,
				0,
			),
			totalErrors: workerInfo.reduce((sum, w) => sum + w.errorsCount, 0),
		};
	}

	/**
	 * Check if worker pool is running
	 */
	get running(): boolean {
		return this.isRunning;
	}

	/**
	 * Get number of workers
	 */
	get workerCount(): number {
		return this.workers.length;
	}
}
