import type { ReactNode } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import AuthContext, { type AuthContextType } from "./AuthContext";
import { authDB } from "@/indexedDB/authDB";
import { decodeJwt } from "@/utils/jwt";
import { backendUrl } from "@/honoClient";

/**
 * AuthProvider component that wraps your app and provides authentication context.
 * It loads, saves, and clears auth data from IndexedDB using Dexie.
 *
 * @param {ReactNode} children - Child components that require access to auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[] | null>(null);
	const [roles, setRoles] = useState<string[] | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState<string | null>(null);
	const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<
		number | null
	>(null);
	const refreshTimerRef = useRef<number | null>(null);
	const isRefreshingRef = useRef(false);

	const decodeExpiry = useCallback((token: string | null | undefined) => {
		if (!token) return null;
		const payload = decodeJwt(token);
		if (!payload?.exp) return null;
		return payload.exp * 1000;
	}, []);

	useEffect(() => {
		(async () => {
			const stored = await authDB.auth.get("auth");
			if (stored) {
				setUserId(stored.userId);
				setUserName(stored.userName);
				setPermissions(stored.permissions);
				setRoles(stored.roles);
				setAccessToken(stored.accessToken ?? null);
				setRefreshToken(stored.refreshToken ?? null);
				setAccessTokenExpiresAt(stored.accessTokenExpiresAt ?? null);
			}
			setLoading(false);
		})();
	}, []);

	const clearRefreshTimer = () => {
		if (refreshTimerRef.current) {
			window.clearTimeout(refreshTimerRef.current);
			refreshTimerRef.current = null;
		}
	};

	const clearAuthData = useCallback(async () => {
		clearRefreshTimer();
		setUserId(null);
		setUserName(null);
		setPermissions(null);
		setRoles(null);
		setAccessToken(null);
		setRefreshToken(null);
		setAccessTokenExpiresAt(null);
		await authDB.auth.delete("auth");
	}, []);

	const saveAuthData = useCallback<
		AuthContextType["saveAuthData"]
	>(
		userData: NonNullable<AuthContextType["user"]>,
		tokens,
	) => {
		setUserId(userData.id);
		setUserName(userData.name);
		setPermissions(userData.permissions);
		setRoles(userData.roles);

		const resolvedAccessToken = tokens?.accessToken ?? accessToken;
		const resolvedRefreshToken = tokens?.refreshToken ?? refreshToken;
		setAccessToken(resolvedAccessToken ?? null);
		setRefreshToken(resolvedRefreshToken ?? null);

		const expiresAt = decodeExpiry(resolvedAccessToken);
		setAccessTokenExpiresAt(expiresAt);

		await authDB.auth.put({
			key: "auth",
			userId: userData.id,
			userName: userData.name,
			permissions: userData.permissions,
			roles: userData.roles,
			accessToken: resolvedAccessToken ?? null,
			refreshToken: resolvedRefreshToken ?? null,
			accessTokenExpiresAt: expiresAt,
		});
	}, [accessToken, refreshToken, decodeExpiry]);

	const refreshSession = useCallback(async () => {
		if (!refreshToken || isRefreshingRef.current) return;
		isRefreshingRef.current = true;
		try {
			const response = await fetch(`${backendUrl}/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ refreshToken }),
			});

			if (!response.ok) {
				throw new Error("Failed to refresh session");
			}

			const data = await response.json();
			await saveAuthData(
				{
					id: data.user.id,
					name: data.user.name,
					permissions: data.user.permissions,
					roles: data.user.roles,
				},
				{
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
				},
			);
		} catch (error) {
			console.error(error);
			await clearAuthData();
		} finally {
			isRefreshingRef.current = false;
		}
	}, [refreshToken, saveAuthData, clearAuthData]);

	useEffect(() => {
		clearRefreshTimer();

		if (!accessTokenExpiresAt || !refreshToken) {
			return;
		}

		const now = Date.now();
		const refreshIn = Math.max(accessTokenExpiresAt - now - 60_000, 5_000);

		refreshTimerRef.current = window.setTimeout(() => {
			void refreshSession();
		}, refreshIn);

		return () => {
			clearRefreshTimer();
		};
	}, [accessTokenExpiresAt, refreshToken, refreshSession]);

	if (loading) {
		return <div>Loading...</div>;
	}

	const checkPermission = (permission: string) =>
		permissions?.includes(permission) ?? false;

	const isAuthenticated = Boolean(accessToken);

	return (
		<AuthContext.Provider
			value={{
				user:
					userId && userName && permissions
						? {
							id: userId,
							name: userName,
							permissions,
							roles: roles ?? [],
						}
						: null,
				accessToken,
				refreshToken,
				accessTokenExpiresAt,
				saveAuthData,
				clearAuthData,
				isAuthenticated,
				checkPermission,
				refreshSession,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
