import { useEffect } from "react";
import { useObservabilityToggle } from "./useObservabilityToggle";
import client from "@/honoClient";

/**
 * Hook to monitor basic frontend performance metrics and report them
 * to the observability system.
 *
 * Tracks:
 * - Page load times (navigation entries)
 * - Route transitions (when available)
 * - Basic SPA performance metrics
 */
export function usePerformanceMonitor() {
	const isObservabilityEnabled = useObservabilityToggle();

	useEffect(() => {
		if (!isObservabilityEnabled) return;

		// Check if Performance Observer is supported
		if (!window.PerformanceObserver) {
			console.warn(
				"PerformanceObserver not supported, skipping performance monitoring",
			);
			return;
		}

		const reportPerformanceMetric = async (metric: {
			type: string;
			duration: number;
			name?: string;
			route?: string;
		}) => {
			try {
				await client.observability.frontend.$post({
					json: {
						eventType: "frontend_metric",
						metadata: {
							metricType: metric.type,
							duration: metric.duration,
							name: metric.name || "",
							route: metric.route || window.location.pathname,
							timestamp: new Date().toISOString(),
							userAgent: navigator.userAgent,
						},
					},
				});
			} catch (error) {
				console.warn("Failed to report performance metric:", error);
			}
		};

		// Track navigation and performance entries
		const observer = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				// Track page load performance
				if (entry.entryType === "navigation") {
					const navEntry = entry as PerformanceNavigationTiming;
					reportPerformanceMetric({
						type: "page_load",
						duration: navEntry.loadEventEnd - navEntry.fetchStart,
						route: window.location.pathname,
					});

					// Also track DOM content loaded time
					if (navEntry.domContentLoadedEventEnd > 0) {
						reportPerformanceMetric({
							type: "dom_content_loaded",
							duration:
								navEntry.domContentLoadedEventEnd -
								navEntry.fetchStart,
							route: window.location.pathname,
						});
					}
				}

				// Track custom measurements (route transitions, etc.)
				if (entry.entryType === "measure") {
					reportPerformanceMetric({
						type: "route_transition",
						duration: entry.duration,
						name: entry.name,
						route: window.location.pathname,
					});
				}

				// Track resource loading times for critical resources
				if (entry.entryType === "resource") {
					const resourceEntry = entry as PerformanceResourceTiming;

					// Only track JavaScript and CSS files to avoid noise
					if (
						resourceEntry.name.includes(".js") ||
						resourceEntry.name.includes(".css")
					) {
						reportPerformanceMetric({
							type: "resource_load",
							duration:
								resourceEntry.responseEnd -
								resourceEntry.fetchStart,
							name: resourceEntry.name,
							route: window.location.pathname,
						});
					}
				}
			}
		});

		// Observe different types of performance entries
		try {
			observer.observe({
				entryTypes: ["navigation", "measure", "resource"],
			});
		} catch (error) {
			console.warn("Failed to start performance observer:", error);
		}

		// Track First Contentful Paint and Largest Contentful Paint if available
		if ("web-vitals" in window || window.PerformanceObserver) {
			// Track Core Web Vitals using PerformanceObserver
			const webVitalsObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === "largest-contentful-paint") {
						reportPerformanceMetric({
							type: "largest_contentful_paint",
							duration: entry.startTime,
							route: window.location.pathname,
						});
					}
				}
			});

			try {
				webVitalsObserver.observe({
					entryTypes: ["largest-contentful-paint"],
				});
			} catch {
				// Ignore if not supported
			}
		}

		// Cleanup function
		return () => {
			observer.disconnect();
		};
	}, [isObservabilityEnabled]);
}

/**
 * Hook to manually report custom performance metrics.
 * Useful for tracking specific user interactions or component render times.
 */
export function useErrorReporter() {
	const isObservabilityEnabled = useObservabilityToggle();

	const reportError = async (
		error: Error,
		context?: Record<string, unknown>,
	) => {
		if (!isObservabilityEnabled) return;

		try {
			await client.observability.frontend.$post({
				json: {
					eventType: "frontend_error",
					errorMessage: error.message,
					stackTrace: error.stack || "",
					route: window.location.pathname,
					metadata: {
						...context,
						errorName: error.name,
						timestamp: new Date().toISOString(),
						userAgent: navigator.userAgent,
						url: window.location.href,
					},
				},
			});
		} catch (reportError) {
			console.warn("Failed to report error:", reportError);
		}
	};

	return { reportError };
}
