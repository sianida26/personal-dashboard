import React from "react";
import ReactDOM from "react-dom/client";
import { initializeOtel, trackPerformanceMetrics } from "@/lib/telemetry";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./styles/tailwind.css";
import "./styles/fonts/manrope.css";

// Initialize OpenTelemetry observability
initializeOtel();

// Track performance metrics
trackPerformanceMetrics();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>,
);
