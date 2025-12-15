// OpenTelemetry configuration
const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || "";
const OTEL_HEADERS = import.meta.env.VITE_OTEL_EXPORTER_OTLP_HEADERS || "";
const SERVICE_NAME = "dasbort";
const ENVIRONMENT = import.meta.env.MODE || "development";

let isInitialized = false;

/**
 * Initialize OpenTelemetry observability
 * Sets up basic error tracking and performance monitoring
 */
export function initializeOtel() {
	if (isInitialized) {
		return;
	}

	try {
		// Mark as initialized to enable tracking functions
		isInitialized = true;
	} catch (error) {
		console.error("Failed to initialize OpenTelemetry:", error);
	}
}

/**
 * Track an error to OpenTelemetry
 * Sends error data via HTTP to OTEL endpoint
 */
export function trackError(
	error: Error,
	additionalContext?: Record<string, string | number | boolean>,
) {
	if (!isInitialized) {
		return;
	}

	try {
		// Prepare error payload for OpenTelemetry
		const payload = {
			service_name: SERVICE_NAME,
			environment: ENVIRONMENT,
			error: {
				type: error.name,
				message: error.message,
				stack: error.stack,
			},
			context: {
				url: window.location.href,
				path: window.location.pathname,
				referrer: document.referrer,
				user_agent: navigator.userAgent,
				language: navigator.language,
				screen_width: window.screen.width,
				screen_height: window.screen.height,
				timestamp: new Date().toISOString(),
				...additionalContext,
			},
		};

		// Send to OpenTelemetry endpoint (fire and forget)
		fetch(OTEL_ENDPOINT.replace("/v1/traces", "/v1/logs"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(OTEL_HEADERS
					? { "signoz-access-token": OTEL_HEADERS }
					: {}),
			},
			body: JSON.stringify(payload),
		}).catch(() => {
			// Silently fail to avoid recursive errors
		});
	} catch {
		// Silently fail to avoid recursive errors
	}
}

/**
 * Track a custom event
 */
export function trackEvent(
	eventName: string,
	properties?: Record<string, string | number | boolean>,
) {
	if (!isInitialized) {
		return;
	}

	try {
		const payload = {
			service_name: SERVICE_NAME,
			environment: ENVIRONMENT,
			event_name: eventName,
			properties: {
				timestamp: new Date().toISOString(),
				...properties,
			},
		};

		fetch(OTEL_ENDPOINT.replace("/v1/traces", "/v1/logs"), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(OTEL_HEADERS ? { Authorization: OTEL_HEADERS } : {}),
			},
			body: JSON.stringify(payload),
		}).catch(() => {});
	} catch {
		// Silently fail
	}
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, pageUrl?: string) {
	trackEvent("page_view", {
		page_name: pageName,
		page_url: pageUrl || window.location.href,
		page_path: window.location.pathname,
	});
}

/**
 * Create a manual span for tracking operations
 * Simplified version - returns null for now as we're not using full OpenTelemetry
 */
export function createSpan(_name: string) {
	return null;
}

/**
 * Track API request with duration
 */
export function trackApiRequest(
	method: string,
	url: string,
	status: number,
	duration: number,
) {
	trackEvent("api_request", {
		"http.method": method,
		"http.url": url,
		"http.status_code": status,
		"http.duration_ms": duration,
	});
}

/**
 * Track performance metrics (Core Web Vitals)
 */
export function trackPerformanceMetrics() {
	if (!isInitialized || typeof PerformanceObserver === "undefined") {
		return;
	}

	try {
		// Largest Contentful Paint (LCP)
		const lcpObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const lastEntry = entries[entries.length - 1];
			if (lastEntry) {
				trackEvent("web_vital_lcp", {
					value: Math.round(lastEntry.startTime),
					rating:
						lastEntry.startTime > 4000
							? "poor"
							: lastEntry.startTime > 2500
								? "needs-improvement"
								: "good",
				});
			}
		});
		lcpObserver.observe({
			type: "largest-contentful-paint",
			buffered: true,
		});

		// First Input Delay (FID)
		const fidObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			for (const entry of entries) {
				const fidEntry = entry as PerformanceEventTiming;
				const fid = fidEntry.processingStart - fidEntry.startTime;
				trackEvent("web_vital_fid", {
					value: Math.round(fid),
					rating:
						fid > 300
							? "poor"
							: fid > 100
								? "needs-improvement"
								: "good",
				});
			}
		});
		fidObserver.observe({ type: "first-input", buffered: true });

		// Cumulative Layout Shift (CLS)
		let clsValue = 0;
		const clsObserver = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			for (const entry of entries) {
				const layoutShiftEntry = entry as PerformanceEntry & {
					value: number;
				};
				if (!layoutShiftEntry.value) continue;
				clsValue += layoutShiftEntry.value;
			}
		});
		clsObserver.observe({ type: "layout-shift", buffered: true });

		// Report CLS when page is hidden
		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.visibilityState === "hidden") {
					trackEvent("web_vital_cls", {
						value: Math.round(clsValue * 1000) / 1000,
						rating:
							clsValue > 0.25
								? "poor"
								: clsValue > 0.1
									? "needs-improvement"
									: "good",
					});
				}
			},
			{ once: true },
		);

		// Navigation Timing
		if (typeof performance !== "undefined" && performance.timing) {
			window.addEventListener("load", () => {
				setTimeout(() => {
					const timing = performance.timing;
					const loadTime =
						timing.loadEventEnd - timing.navigationStart;
					const domReady =
						timing.domContentLoadedEventEnd -
						timing.navigationStart;
					const firstPaint =
						timing.responseStart - timing.navigationStart;

					trackEvent("page_load_timing", {
						load_time: loadTime,
						dom_ready: domReady,
						first_paint: firstPaint,
					});
				}, 0);
			});
		}
	} catch (error) {
		console.error("Failed to track performance metrics:", error);
	}
}

// Expose otel object to window for ErrorBoundary
if (typeof window !== "undefined") {
	(
		window as typeof window & { otel?: { trackError: typeof trackError } }
	).otel = {
		trackError,
	};
}

export default {
	initialize: initializeOtel,
	trackError,
	trackEvent,
	trackPageView,
	trackApiRequest,
	trackPerformanceMetrics,
	createSpan,
};
