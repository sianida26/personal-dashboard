import { metrics } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | undefined;

if (process.env.OTEL_ENABLED === "true") {
	const otlpExporterBaseUrl =
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

	// OTLP exporters automatically read OTEL_EXPORTER_OTLP_HEADERS from environment
	// No need to manually parse or pass headers
	const traceExporter = new OTLPTraceExporter({
		url: `${otlpExporterBaseUrl}/v1/traces`,
	});

	const metricExporter = new OTLPMetricExporter({
		url: `${otlpExporterBaseUrl}/v1/metrics`,
	});

	const logExporter = new OTLPLogExporter({
		url: `${otlpExporterBaseUrl}/v1/logs`,
	});

	const metricReader = new PeriodicExportingMetricReader({
		exporter: metricExporter,
		exportIntervalMillis: 60000, // Export every 60 seconds
	});

	// Create resource attributes (shared across traces, metrics, and logs)
	const resource = resourceFromAttributes({
		// Service identification
		"service.name": process.env.OTEL_SERVICE_NAME || "dashboard-backend",
		"service.version": process.env.npm_package_version || "1.0.0",
		"service.namespace": "dasbort",

		// Deployment environment
		"deployment.environment": process.env.APP_ENV || "development",

		// Runtime information
		"process.runtime.name": "bun",
		"process.runtime.version": process.versions.bun || "unknown",
		"process.runtime.description": "Bun JavaScript runtime",

		// Host information
		"host.name": process.env.HOSTNAME || "localhost",
		"host.arch": process.arch,
		"host.os": process.platform,

		// Cloud/container information (if available)
		...(process.env.K8S_POD_NAME && {
			"k8s.pod.name": process.env.K8S_POD_NAME,
		}),
		...(process.env.K8S_NAMESPACE && {
			"k8s.namespace.name": process.env.K8S_NAMESPACE,
		}),
		...(process.env.CONTAINER_NAME && {
			"container.name": process.env.CONTAINER_NAME,
		}),

		// Git information (if available)
		...(process.env.GIT_COMMIT && {
			"vcs.commit.id": process.env.GIT_COMMIT,
		}),
		...(process.env.GIT_BRANCH && {
			"vcs.branch": process.env.GIT_BRANCH,
		}),

		// Deployment metadata
		...(process.env.BUILD_TIME && {
			"deployment.build_time": process.env.BUILD_TIME,
		}),
		...(process.env.BUILD_NUMBER && {
			"deployment.build_number": process.env.BUILD_NUMBER,
		}),
	});

	// NodeSDK handles the LoggerProvider setup automatically
	// We just need to pass the logRecordProcessor
	sdk = new NodeSDK({
		resource,
		traceExporter,
		metricReader,
		logRecordProcessor: new BatchLogRecordProcessor(logExporter),
		instrumentations: [
			getNodeAutoInstrumentations({
				// Disable file system instrumentation (too noisy)
				"@opentelemetry/instrumentation-fs": { enabled: false },

				// Configure HTTP instrumentation
				"@opentelemetry/instrumentation-http": {
					enabled: true,
					ignoreIncomingRequestHook: (req) => {
						const url = req.url || "";
						// Skip health checks and other noisy endpoints
						return (
							url.includes("/health") ||
							url.includes("/favicon.ico") ||
							url.includes("/robots.txt")
						);
					},
					requestHook: (span, request) => {
						// Add additional HTTP request attributes (check for IncomingMessage)
						if ("headers" in request && request.headers) {
							span.setAttribute(
								"http.user_agent",
								request.headers["user-agent"] || "",
							);
							span.setAttribute(
								"http.content_length",
								request.headers["content-length"] || "0",
							);
						}

						// Add request timestamp
						span.setAttribute(
							"http.request_timestamp",
							new Date().toISOString(),
						);
					},
					responseHook: (span, response) => {
						// Add response timestamp
						span.setAttribute(
							"http.response_timestamp",
							new Date().toISOString(),
						);

						// Add response content length if available (check for ServerResponse)
						if (
							"getHeader" in response &&
							typeof response.getHeader === "function"
						) {
							const contentLength =
								response.getHeader("content-length");
							if (contentLength) {
								span.setAttribute(
									"http.response_content_length",
									contentLength,
								);
							}
						}
					},
				},

				// Disable pino instrumentation if using custom pino setup
				"@opentelemetry/instrumentation-pino": { enabled: false },
			}),
		],
	});

	sdk.start();

	// Record startup metric
	const meter = metrics.getMeter(
		process.env.OTEL_SERVICE_NAME || "dashboard-backend",
	);
	const startupCounter = meter.createCounter("server_startups_total", {
		description: "Number of times the server process starts",
	});
	startupCounter.add(1);
}

// Graceful shutdown
process.on("beforeExit", async () => {
	await sdk?.shutdown();
});

process.on("SIGTERM", async () => {
	await sdk?.shutdown();
	process.exit(0);
});

process.on("SIGINT", async () => {
	await sdk?.shutdown();
	process.exit(0);
});
