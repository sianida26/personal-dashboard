import type { AppType } from "backend";
import { hc } from "hono/client";
import { authDB } from "./indexedDB/authDB";

const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined;

if (!backendUrl) throw new Error("Backend URL not set");

const client = hc<AppType>(backendUrl, {
	headers: async () => {
		const authData = await authDB.auth.get("auth");
		return {
			Authorization: `Bearer ${authData?.accessToken ?? ""}`,
		};
	},
});

export default client;

export { backendUrl };
