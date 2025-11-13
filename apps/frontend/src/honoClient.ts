import type { AppType } from "backend";
import { hc } from "hono/client";
import { authDB } from "./indexedDB/authDB";
import { getAuthBridge } from "./utils/authBridge";

const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined;

if (!backendUrl) throw new Error("Backend URL not set");

const rawFetch = globalThis.fetch.bind(globalThis);

const shouldSkipRetry = (url: string) => {
	const pathname = new URL(url).pathname;
	return (
		pathname.endsWith("/auth/login") ||
		pathname.endsWith("/auth/refresh") ||
		pathname.endsWith("/auth/logout")
	);
};

const authFetch: typeof fetch = async (input, init) => {
	const baseRequest = new Request(input, init);
	const initialResponse = await rawFetch(baseRequest.clone());

	if (initialResponse.status !== 401 || shouldSkipRetry(baseRequest.url)) {
		return initialResponse;
	}

	const bridge = getAuthBridge();

	if (!bridge) {
		return initialResponse;
	}

	try {
		await bridge.refreshSession();
	} catch {
		await bridge.clearAuthData().catch(() => {});
		return initialResponse;
	}

	const nextAccessToken = bridge.getAccessToken();

	if (!nextAccessToken) {
		await bridge.clearAuthData().catch(() => {});
		return initialResponse;
	}

	const updatedHeaders = new Headers(baseRequest.headers);
	updatedHeaders.set("Authorization", `Bearer ${nextAccessToken}`);

	const retryRequest = new Request(baseRequest, {
		headers: updatedHeaders,
	});

	const retryResponse = await rawFetch(retryRequest);

	if (retryResponse.status === 401) {
		await bridge.clearAuthData().catch(() => {});
	}

	return retryResponse;
};

const client = hc<AppType>(backendUrl, {
	headers: async () => {
		const bridge = getAuthBridge();
		const bridgeToken = bridge?.getAccessToken();
		if (bridgeToken) {
			return { Authorization: `Bearer ${bridgeToken}` };
		}

		const authData = await authDB.auth.get("auth");
		return {
			Authorization: `Bearer ${authData?.accessToken ?? ""}`,
		};
	},
	fetch: authFetch,
});

export default client;

export { backendUrl };
