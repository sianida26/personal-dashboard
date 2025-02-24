import type { ReactNode } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AuthContext, { type AuthContextType } from "./AuthContext";
import { type AuthData, authDB } from "@/indexedDB/authDB";

/**
 * AuthProvider component that wraps your app and provides authentication context.
 * It loads, saves, and clears auth data from IndexedDB using Dexie.
 *
 * @param {ReactNode} children - Child components that require access to auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	// State variables to hold authentication data.
	const [userId, setUserId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[] | null>(null);
	const [roles, setRoles] = useState<string[] | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);

	// Load auth data from IndexedDB on component mount.
	useEffect(() => {
		(async () => {
			// Retrieve stored auth data using the fixed key "auth".
			const stored = await authDB.auth.get("auth");
			if (stored) {
				setUserId(stored.userId);
				setUserName(stored.userName);
				setPermissions(stored.permissions);
				setRoles(stored.roles);
				setAccessToken(stored.accessToken);
			}
		})();
	}, []);

	/**
	 * Save authentication data to state and persist it in IndexedDB.
	 *
	 * @param userData - User data including id, name, permissions, and roles.
	 * @param token - Optional access token to store.
	 */
	const saveAuthData = async (
		userData: NonNullable<AuthContextType["user"]>,
		token?: NonNullable<AuthContextType["accessToken"]>,
	) => {
		// Update state with user data.
		setUserId(userData.id);
		setUserName(userData.name);
		setPermissions(userData.permissions);
		setRoles(userData.roles);
		if (token) setAccessToken(token);

		// Prepare the data object for IndexedDB.
		const data: AuthData = {
			key: "auth",
			userId: userData.id,
			userName: userData.name,
			permissions: userData.permissions,
			roles: userData.roles,
			accessToken: token ?? accessToken,
		};

		// Store the auth data in IndexedDB.
		await authDB.auth.put(data);
	};

	/**
	 * Clear authentication data from state and remove it from IndexedDB.
	 */
	const clearAuthData = async () => {
		// Reset all auth state variables.
		setUserId(null);
		setUserName(null);
		setPermissions(null);
		setRoles(null);
		setAccessToken(null);
		// Delete the auth data from IndexedDB.
		await authDB.auth.delete("auth");
	};

	/**
	 * Check if the current user has a specific permission.
	 *
	 * @param permission - Permission string to verify.
	 * @returns {boolean} True if the permission exists, false otherwise.
	 */
	const checkPermission = (permission: string) =>
		permissions?.includes(permission) ?? false;

	// Determine if the user is authenticated based on the presence of an accessToken.
	const isAuthenticated = Boolean(accessToken);

	return (
		<AuthContext.Provider
			value={{
				// Only provide user data if all required fields are present.
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
				saveAuthData,
				clearAuthData,
				isAuthenticated,
				checkPermission,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
