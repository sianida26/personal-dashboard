import { useState } from "react";

/**
 * Test component for error boundary functionality
 * This component can throw an error on demand to test the ErrorBoundary
 */
export function ErrorBoundaryTest() {
	const [shouldThrow, setShouldThrow] = useState(false);

	if (shouldThrow) {
		throw new Error("Test error thrown by ErrorBoundaryTest component");
	}

	return (
		<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
			<h3 className="text-lg font-medium text-yellow-800">Error Boundary Test</h3>
			<p className="mt-2 text-sm text-yellow-700">
				Click the button below to test the error boundary functionality.
			</p>
			<button
				type="button"
				onClick={() => setShouldThrow(true)}
				className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
			>
				Throw Test Error
			</button>
		</div>
	);
}
