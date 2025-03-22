import { ConfidentialClientApplication } from "@azure/msal-node";
import { Hono } from "hono";
import type HonoEnv from "../../../types/HonoEnv";
import appEnv from "../../../appEnv";
import { notFound } from "../../../errors/DashboardError";
import { Client } from "@microsoft/microsoft-graph-client";

if (
	!appEnv.MICROSOFT_CLIENT_ID ||
	!appEnv.MICROSOFT_CLIENT_SECRET ||
	!appEnv.MICROSOFT_TENANT_ID
) {
	throw new Error(
		"MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_TENANT_ID must be set",
	);
}

const cca = new ConfidentialClientApplication({
	auth: {
		clientId: appEnv.MICROSOFT_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${appEnv.MICROSOFT_TENANT_ID}`,
		clientSecret: appEnv.MICROSOFT_CLIENT_SECRET,
	},
});

const REDIRECT_URI = `${appEnv.BASE_URL}/auth/microsoft/callback`;
const SCOPES = ["user.read"];

const microsoftRouter = new Hono<HonoEnv>()
	.get("/login", async (c) => {
		const authCodeUrl = await cca.getAuthCodeUrl({
			scopes: ["user.read"],
			redirectUri: REDIRECT_URI,
		});

		return c.redirect(authCodeUrl);
	})
	.get("/callback", async (c) => {
		const code = c.req.query("code");

		if (!code) {
			throw notFound();
		}

		const tokenResponse = await cca.acquireTokenByCode({
			code,
			scopes: [],
			redirectUri: REDIRECT_URI,
		});

		console.log(tokenResponse);

		const graph = await fetch("https://graph.microsoft.com/v1.0/me", {
			headers: {
				Authorization: `Bearer ${tokenResponse.accessToken}`,
			},
		});

		const user = await graph.json();

		console.log(user);

		return c.redirect(appEnv.FRONTEND_URL);
	});

export default microsoftRouter;
