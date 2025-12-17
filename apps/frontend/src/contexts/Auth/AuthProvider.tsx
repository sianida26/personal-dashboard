import { LoadingSpinner } from "@repo/ui";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { backendUrl } from "@/honoClient";
import { authDB } from "@/indexedDB/authDB";
import { setAuthBridge } from "@/utils/authBridge";
import { decodeJwt } from "@/utils/jwt";
import AuthContext, { type AuthContextType } from "./AuthContext";

const REFRESH_OFFLINE_TOAST_ID = "auth-refresh-offline";

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
	const [isRefreshing, setIsRefreshing] = useState(false);
	const refreshTimerRef = useRef<number | null>(null);
	const isRefreshingRef = useRef(false);
	const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

	const decodeExpiry = useCallback((token: string | null | undefined) => {
		if (!token) return null;
		const payload = decodeJwt(token);
		if (!payload?.exp) return null;
		return payload.exp * 1000;
	}, []);

	const clearRefreshTimer = useCallback(() => {
		if (refreshTimerRef.current) {
			window.clearTimeout(refreshTimerRef.current);
			refreshTimerRef.current = null;
		}
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

	// Cross-tab communication: sync auth state across all tabs
	useEffect(() => {
		if (typeof BroadcastChannel === "undefined") {
			return; // BroadcastChannel not supported in this browser
		}

		const channel = new BroadcastChannel("auth-sync");
		broadcastChannelRef.current = channel;

		const handleMessage = (event: MessageEvent) => {
			// Intentional logout from another tab
			if (event.data?.type === "logout") {
				void (async () => {
					clearRefreshTimer();
					setUserId(null);
					setUserName(null);
					setPermissions(null);
					setRoles(null);
					setAccessToken(null);
					setRefreshToken(null);
					setAccessTokenExpiresAt(null);
					await authDB.auth.delete("auth");
				})();
			}

			// Token refresh from another tab - sync the new tokens
			if (event.data?.type === "token-refreshed") {
				void (async () => {
					const stored = await authDB.auth.get("auth");
					if (stored) {
						setUserId(stored.userId);
						setUserName(stored.userName);
						setPermissions(stored.permissions);
						setRoles(stored.roles);
						setAccessToken(stored.accessToken ?? null);
						setRefreshToken(stored.refreshToken ?? null);
						setAccessTokenExpiresAt(
							stored.accessTokenExpiresAt ?? null,
						);
					}
				})();
			}
		};

		channel.addEventListener("message", handleMessage);

		return () => {
			channel.removeEventListener("message", handleMessage);
			channel.close();
			broadcastChannelRef.current = null;
		};
	}, [clearRefreshTimer]);

	// Fallback: Listen for storage events (for browsers without BroadcastChannel)
	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			// Intentional logout from another tab
			if (event.key === "auth-logout-event") {
				void (async () => {
					clearRefreshTimer();
					setUserId(null);
					setUserName(null);
					setPermissions(null);
					setRoles(null);
					setAccessToken(null);
					setRefreshToken(null);
					setAccessTokenExpiresAt(null);
					await authDB.auth.delete("auth");
				})();
			}

			// Token refresh from another tab - sync the new tokens
			if (event.key === "auth-token-refreshed") {
				void (async () => {
					const stored = await authDB.auth.get("auth");
					if (stored) {
						setUserId(stored.userId);
						setUserName(stored.userName);
						setPermissions(stored.permissions);
						setRoles(stored.roles);
						setAccessToken(stored.accessToken ?? null);
						setRefreshToken(stored.refreshToken ?? null);
						setAccessTokenExpiresAt(
							stored.accessTokenExpiresAt ?? null,
						);
					}
				})();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [clearRefreshTimer]);

	const clearAuthData = useCallback(
		async (options?: { broadcastLogout?: boolean }) => {
			const shouldBroadcast = options?.broadcastLogout ?? false;

			clearRefreshTimer();
			setUserId(null);
			setUserName(null);
			setPermissions(null);
			setRoles(null);
			setAccessToken(null);
			setRefreshToken(null);
			setAccessTokenExpiresAt(null);
			await authDB.auth.delete("auth");

			// Only broadcast logout if this is an intentional user action
			if (shouldBroadcast) {
				// Notify other tabs about the logout via BroadcastChannel
				if (broadcastChannelRef.current) {
					broadcastChannelRef.current.postMessage({ type: "logout" });
				}

				// Fallback: Use localStorage to trigger storage event in other tabs
				try {
					localStorage.setItem(
						"auth-logout-event",
						Date.now().toString(),
					);
					localStorage.removeItem("auth-logout-event");
				} catch {
					// localStorage might be unavailable (private browsing, etc.)
				}
			}
		},
		[clearRefreshTimer],
	);

	const saveAuthData = useCallback<AuthContextType["saveAuthData"]>(
		async (userData, tokens) => {
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
		},
		[accessToken, refreshToken, decodeExpiry],
	);

	const refreshSession = useCallback(async () => {
		if (!refreshToken || isRefreshingRef.current) return;

		// Try to acquire refresh lock to prevent multiple tabs from refreshing simultaneously
		const lockKey = "auth-refresh-lock";
		const lockTimeout = 10000; // 10 seconds
		const lockValue = Date.now().toString();

		try {
			const existingLock = localStorage.getItem(lockKey);
			const existingLockTime = existingLock
				? Number.parseInt(existingLock)
				: 0;

			// If another tab holds a recent lock, wait and read updated tokens instead
			if (existingLock && Date.now() - existingLockTime < lockTimeout) {
				// Set refreshing state to prevent flicker
				setIsRefreshing(true);

				// Another tab is refreshing, wait a bit then read the new tokens
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const stored = await authDB.auth.get("auth");
				if (stored && stored.refreshToken !== refreshToken) {
					// Tokens were updated by another tab, use them
					setUserId(stored.userId);
					setUserName(stored.userName);
					setPermissions(stored.permissions);
					setRoles(stored.roles);
					setAccessToken(stored.accessToken ?? null);
					setRefreshToken(stored.refreshToken ?? null);
					setAccessTokenExpiresAt(
						stored.accessTokenExpiresAt ?? null,
					);
				}

				setIsRefreshing(false);
				return;
			}

			// Acquire lock
			localStorage.setItem(lockKey, lockValue);
		} catch {
			// localStorage unavailable, proceed anyway
		}

		isRefreshingRef.current = true;
		setIsRefreshing(true);

		try {
			const response = await fetch(`${backendUrl}/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ refreshToken }),
			});

			if (!response.ok) {
				if (response.status === 401) {
					let errorText = "Token refresh failed";
					try {
						const errorData = await response.json();
						errorText = errorData.message || errorText;
					} catch {
						errorText = await response
							.text()
							.catch(() => errorText);
					}

					console.warn("[auth] Token refresh failed (401):", {
						error: errorText,
						timestamp: new Date().toISOString(),
					});

					await clearAuthData({ broadcastLogout: false });
					toast.dismiss(REFRESH_OFFLINE_TOAST_ID);
					return;
				}

				console.warn(
					`[auth] Token refresh failed with status ${response.status}, will retry on next attempt`,
				);

				toast.dismiss(REFRESH_OFFLINE_TOAST_ID);
				return;
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

			toast.dismiss(REFRESH_OFFLINE_TOAST_ID);

			if (broadcastChannelRef.current) {
				broadcastChannelRef.current.postMessage({
					type: "token-refreshed",
				});
			}

			try {
				localStorage.setItem(
					"auth-token-refreshed",
					Date.now().toString(),
				);
				localStorage.removeItem("auth-token-refreshed");
			} catch {
				// localStorage might be unavailable
			}
		} catch (error) {
			console.warn(
				"[auth] Token refresh skipped – backend unreachable. Keeping current session active.",
				error,
			);

			toast.error("Can't reach the server right now.", {
				description:
					"We'll keep you signed in and try again once the connection is back.",
				id: REFRESH_OFFLINE_TOAST_ID,
				duration: 6000,
			});

			clearRefreshTimer();
			refreshTimerRef.current = window.setTimeout(() => {
				void refreshSession();
			}, 30_000);
		} finally {
			isRefreshingRef.current = false;
			setIsRefreshing(false);

			// Release lock
			try {
				const currentLock = localStorage.getItem(lockKey);
				if (currentLock === lockValue) {
					localStorage.removeItem(lockKey);
				}
			} catch {
				// localStorage unavailable
			}
		}
	}, [refreshToken, saveAuthData, clearAuthData, clearRefreshTimer]);

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
	}, [accessTokenExpiresAt, refreshToken, refreshSession, clearRefreshTimer]);

	// Refresh token when user returns to the tab (focus event)
	// This ensures token is fresh even if setTimeout was throttled by browser
	useEffect(() => {
		const handleWindowFocus = () => {
			if (!accessToken || !accessTokenExpiresAt) {
				return;
			}

			const now = Date.now();
			const timeUntilExpiry = accessTokenExpiresAt - now;
			const FIVE_MINUTES_MS = 5 * 60 * 1000;

			// If token expires within 5 minutes, refresh it proactively
			if (timeUntilExpiry < FIVE_MINUTES_MS && timeUntilExpiry > 0) {
				void refreshSession();
			}
		};

		window.addEventListener("focus", handleWindowFocus);
		return () => {
			window.removeEventListener("focus", handleWindowFocus);
		};
	}, [accessToken, accessTokenExpiresAt, refreshSession]);

	useEffect(() => {
		setAuthBridge({
			getAccessToken: () => accessToken,
			refreshSession,
			clearAuthData: async () =>
				clearAuthData({ broadcastLogout: false }),
		});

		return () => {
			setAuthBridge(null);
		};
	}, [accessToken, refreshSession, clearAuthData]);

	if (loading) {
		return (
			<div className="flex h-screen w-screen items-center justify-center rounded-lg border bg-card">
				<LoadingSpinner />
			</div>
		);
	}

	const checkPermission = (permission: string) =>
		permissions?.includes(permission) ?? false;

	const hasNoAccess = () => {
		// User has no access if they're authenticated but have no roles AND no permissions
		if (!isAuthenticated || !userId) return false;
		const hasNoRoles = !roles || roles.length === 0;
		const hasNoPermissions = !permissions || permissions.length === 0;
		return hasNoRoles && hasNoPermissions;
	};

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
				clearAuthData: async () =>
					clearAuthData({ broadcastLogout: true }),
				isAuthenticated,
				checkPermission,
				hasNoAccess,
				refreshSession,
				isRefreshing,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
