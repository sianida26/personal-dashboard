/**
 * Simple circuit breaker to prevent hammering a failed server
 * Tracks consecutive failures and temporarily blocks requests
 */

interface CircuitState {
	failures: number;
	lastFailureTime: number;
	isOpen: boolean;
}

const circuits = new Map<string, CircuitState>();

const FAILURE_THRESHOLD = 3; // Open circuit after 3 consecutive failures
const RESET_TIMEOUT = 30000; // Try again after 30 seconds
const FAILURE_WINDOW = 10000; // Reset failure count if no failures in 10 seconds

/**
 * Check if a circuit breaker should block a request
 * @param key - Unique key for the circuit (e.g., endpoint URL)
 * @returns true if request should be blocked, false otherwise
 */
export function isCircuitOpen(key: string): boolean {
	const circuit = circuits.get(key);
	if (!circuit) return false;

	const now = Date.now();

	// Reset circuit if enough time has passed
	if (circuit.isOpen && now - circuit.lastFailureTime > RESET_TIMEOUT) {
		circuit.isOpen = false;
		circuit.failures = 0;
		return false;
	}

	return circuit.isOpen;
}

/**
 * Record a successful request
 * @param key - Unique key for the circuit
 */
export function recordSuccess(key: string): void {
	const circuit = circuits.get(key);
	if (!circuit) return;

	// Reset the circuit on success
	circuit.failures = 0;
	circuit.isOpen = false;
}

/**
 * Record a failed request
 * @param key - Unique key for the circuit
 */
export function recordFailure(key: string): void {
	const now = Date.now();
	let circuit = circuits.get(key);

	if (!circuit) {
		circuit = {
			failures: 0,
			lastFailureTime: now,
			isOpen: false,
		};
		circuits.set(key, circuit);
	}

	// Reset failure count if last failure was long ago
	if (now - circuit.lastFailureTime > FAILURE_WINDOW) {
		circuit.failures = 0;
	}

	circuit.failures++;
	circuit.lastFailureTime = now;

	// Open circuit if threshold exceeded
	if (circuit.failures >= FAILURE_THRESHOLD) {
		circuit.isOpen = true;
		console.warn(
			`[Circuit Breaker] Circuit opened for "${key}" after ${circuit.failures} failures. Will retry after ${RESET_TIMEOUT / 1000}s`,
		);
	}
}

/**
 * Reset a specific circuit
 * @param key - Unique key for the circuit
 */
export function resetCircuit(key: string): void {
	circuits.delete(key);
}

/**
 * Reset all circuits (useful for testing or manual recovery)
 */
export function resetAllCircuits(): void {
	circuits.clear();
}
