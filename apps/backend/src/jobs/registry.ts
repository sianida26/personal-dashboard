import type { JobHandler } from "../services/jobs/types";
import dataProcessingHandler from "./handlers/data-processing";
import emailNotificationHandler from "./handlers/email-notification";
import inAppNotificationHandler from "./handlers/in-app-notification";
import whatsappNotificationHandler from "./handlers/whatsapp-notification";

export class JobHandlerRegistry {
	private handlers = new Map<string, JobHandler>();

	/**
	 * Register a job handler
	 * @param handler - The job handler to register
	 */
	register(handler: JobHandler): void {
		if (this.handlers.has(handler.type)) {
			throw new Error(
				`Job handler for type '${handler.type}' already registered`,
			);
		}
		this.handlers.set(handler.type, handler);
	}

	/**
	 * Get a job handler by type
	 * @param type - The job type
	 * @returns The job handler or undefined if not found
	 */
	get(type: string): JobHandler | undefined {
		return this.handlers.get(type);
	}

	/**
	 * Check if a handler is registered for a type
	 * @param type - The job type
	 * @returns True if handler is registered
	 */
	has(type: string): boolean {
		return this.handlers.has(type);
	}

	/**
	 * Get all registered job types
	 * @returns Array of registered job types
	 */
	getTypes(): string[] {
		return Array.from(this.handlers.keys());
	}

	/**
	 * Get all registered handlers
	 * @returns Array of registered handlers
	 */
	getHandlers(): JobHandler[] {
		return Array.from(this.handlers.values());
	}

	/**
	 * Unregister a job handler
	 * @param type - The job type to unregister
	 * @returns True if handler was removed
	 */
	unregister(type: string): boolean {
		return this.handlers.delete(type);
	}

	/**
	 * Clear all registered handlers
	 */
	clear(): void {
		this.handlers.clear();
	}
}

// Global registry instance
const jobHandlerRegistry = new JobHandlerRegistry();

// All handlers now properly extend Record<string, unknown>
jobHandlerRegistry.register(inAppNotificationHandler);
jobHandlerRegistry.register(emailNotificationHandler);
jobHandlerRegistry.register(whatsappNotificationHandler);
jobHandlerRegistry.register(dataProcessingHandler);

export default jobHandlerRegistry;
