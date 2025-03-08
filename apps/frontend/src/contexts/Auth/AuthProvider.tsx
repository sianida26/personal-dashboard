import type { ReactNode } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AuthContext, { type AuthContextType } from "./AuthContext";
import { authDB } from "@/indexedDB/authDB";

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

	useEffect(() => {
		(async () => {
			const stored = await authDB.auth.get("auth");
			if (stored) {
				setUserId(stored.userId);
				setUserName(stored.userName);
				setPermissions(stored.permissions);
				setRoles(stored.roles);
				setAccessToken(stored.accessToken);
			}
			setLoading(false);
		})();
	}, []);

	if (loading) {
		// Block UI while retrieving auth data
		return <div>Loading...</div>;
	}

	const saveAuthData = async (
		userData: NonNullable<AuthContextType["user"]>,
		token?: NonNullable<AuthContextType["accessToken"]>,
	) => {
		setUserId(userData.id);
		setUserName(userData.name);
		setPermissions(userData.permissions);
		setRoles(userData.roles);
		if (token) setAccessToken(token);

		const data = {
			key: "auth",
			userId: userData.id,
			userName: userData.name,
			permissions: userData.permissions,
			roles: userData.roles,
			accessToken: token ?? accessToken,
		};

		await authDB.auth.put(data);
	};

	const clearAuthData = async () => {
		setUserId(null);
		setUserName(null);
		setPermissions(null);
		setRoles(null);
		setAccessToken(null);
		await authDB.auth.delete("auth");
	};

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
