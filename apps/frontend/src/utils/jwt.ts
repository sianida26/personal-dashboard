export type JwtPayload = {
	exp?: number;
	[key: string]: unknown;
};

export const decodeJwt = (token: string): JwtPayload | null => {
	try {
		const [, payload] = token.split(".");
		if (!payload) return null;
		const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
		if (!globalThis.atob) {
			return null;
		}
		const decoded = globalThis.atob(normalized);
		return JSON.parse(decoded) as JwtPayload;
	} catch (error) {
		console.error("Failed to decode JWT", error);
		return null;
	}
};
