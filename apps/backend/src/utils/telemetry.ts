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

	sdk = new NodeSDK({
		resource: resourceFromAttributes({
			"service.name":
				process.env.OTEL_SERVICE_NAME || "dashboard-backend",
			"service.version": process.env.npm_package_version || "1.0.0",
			"deployment.environment": process.env.APP_ENV || "development",
		}),
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
process.on("beforeExit", () => {
	sdk?.shutdown();
});

process.on("SIGTERM", () => {
	sdk?.shutdown().then(() => process.exit(0));
});

process.on("SIGINT", () => {
	sdk?.shutdown().then(() => process.exit(0));
});
