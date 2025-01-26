import type { ReactNode } from "@tanstack/react-router";
import { useState } from "react";
import AuthContext, { type AuthContextType } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [userId, setUserId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[] | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(
		localStorage.getItem("accessToken"),
	);

	const saveAuthData = (
		userData: NonNullable<AuthContextType["user"]>,
		accessToken?: NonNullable<AuthContextType["accessToken"]>,
	) => {
		setUserId(userData.id);
		setUserName(userData.name);
		setPermissions(userData.permissions);
		if (accessToken) {
			setAccessToken(accessToken);
			localStorage.setItem("accessToken", accessToken);
		}
	};

	const clearAuthData = () => {
		setUserId(null);
		setUserName(null);
		setPermissions(null);
		setAccessToken(null);
		localStorage.removeItem("accessToken");
	};

	const checkPermission = (permission: string) => {
		return permissions?.includes(permission) ?? false;
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
								permissions: permissions,
								roles: [],
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
