import { useEffect } from "react";
import client from "@/honoClient";

// Console methods to intercept
const CONSOLE_METHODS = ["log", "info", "warn", "error", "debug"] as const;
type ConsoleMethod = (typeof CONSOLE_METHODS)[number];

// Store original console methods
const originalConsole: Record<ConsoleMethod, (...args: unknown[]) => void> =
	{} as Record<ConsoleMethod, (...args: unknown[]) => void>;

// Flag to prevent infinite loops
let isReporting = false;

/**
 * Hook to capture and report console logs to the observability system
 */
export function useConsoleLogger() {
	useEffect(() => {
		// Store original methods
		CONSOLE_METHODS.forEach((method) => {
			originalConsole[method] = (
				console as unknown as Record<
					string,
					(...args: unknown[]) => void
				>
			)[method];
		});

		// Override console methods
		CONSOLE_METHODS.forEach((method) => {
			(
				console as unknown as Record<
					string,
					(...args: unknown[]) => void
				>
			)[method] = (...args: unknown[]) => {
				// Call original method first
				originalConsole[method](...args);

				// Report to observability system (async, non-blocking) only if not already reporting
				if (!isReporting) {
					isReporting = true;
					reportConsoleLog(method, args).finally(() => {
						isReporting = false;
					});
				}
			};
		});

		// Cleanup function to restore original console methods
		return () => {
			CONSOLE_METHODS.forEach((method) => {
				(
					console as unknown as Record<
						string,
						(...args: unknown[]) => void
					>
				)[method] = originalConsole[method];
			});
		};
	}, []);
}

/**
 * Report console log to observability system
 */
async function reportConsoleLog(level: ConsoleMethod, args: unknown[]) {
	try {
		// Convert args to strings for storage
		const logMessage = args
			.map((arg) => {
				if (typeof arg === "string") return arg;
				if (typeof arg === "object") {
					try {
						return JSON.stringify(arg, null, 2);
					} catch {
						return "[Circular Object]";
					}
				}
				return String(arg);
			})
			.join(" ");

		await client.observability.frontend.$post({
			json: {
				eventType: "frontend_log",
				logLevel: level,
				logMessage,
				logArgs: args.map((arg) => {
					// Serialize objects safely
					if (typeof arg === "object" && arg !== null) {
						try {
							return JSON.parse(JSON.stringify(arg));
						} catch {
							return "[Unserializable Object]";
						}
					}
					return arg;
				}),
				route: window.location.pathname,
				metadata: {
					userAgent: navigator.userAgent,
					timestamp: Date.now(),
					url: window.location.href,
				},
			},
		});
	} catch {
		// Silently fail to avoid infinite loops - do not log errors
	}
}

export default useConsoleLogger;
