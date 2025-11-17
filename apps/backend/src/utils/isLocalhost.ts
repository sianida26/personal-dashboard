/**
 * Checks if a hostname is a local/localhost address
 * @param hostname - The hostname to check
 * @returns true if the hostname is localhost, false otherwise
 */
export function isLocalhost(hostname: string): boolean {
	const normalizedHostname = hostname.toLowerCase();

	// Check for standard localhost names
	if (
		normalizedHostname === "localhost" ||
		normalizedHostname === "0.0.0.0" ||
		normalizedHostname.endsWith(".localhost")
	) {
		return true;
	}

	// Check for IPv4 loopback (127.0.0.0/8)
	if (/^127\.(\d+)\.(\d+)\.(\d+)$/.test(normalizedHostname)) {
		return true;
	}

	// Check for IPv6 loopback (::1) and variations
	if (
		normalizedHostname === "::1" ||
		normalizedHostname === "0:0:0:0:0:0:0:1" ||
		normalizedHostname === "0000:0000:0000:0000:0000:0000:0000:0001"
	) {
		return true;
	}

	return false;
}
