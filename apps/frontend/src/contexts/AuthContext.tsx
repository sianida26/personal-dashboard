import { ReactNode } from "@tanstack/react-router";
import { createContext, useState } from "react";

interface AuthContextType {
	user: {
		id: string;
		name: string;
		permissions: string[];
	} | null;
	accessToken: string | null;
	saveAuthData: (
		userData: NonNullable<AuthContextType["user"]>,
		accessToken: NonNullable<AuthContextType["accessToken"]>
	) => void;
	clearAuthData: () => void;
	isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [userId, setUserId] = useState<string | null>(null);
	const [userName, setUserName] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[] | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(
		localStorage.getItem("accessToken")
	);

	const saveAuthData = (
		userData: NonNullable<AuthContextType["user"]>,
		accessToken: NonNullable<AuthContextType["accessToken"]>
	) => {
		setUserId(userData.id);
		setUserName(userData.name);
		setPermissions(userData.permissions);
		setAccessToken(accessToken);
		localStorage.setItem("accessToken", accessToken);
	};

	const clearAuthData = () => {
		setUserId(null);
		setUserName(null);
		setPermissions(null);
		setAccessToken(null);
		localStorage.removeItem("accessToken");
	};

	const isAuthenticated = Boolean(accessToken);

	return (
		<AuthContext.Provider
			value={{
				user: userId
					? { id: userId, name: userName!, permissions: permissions! }
					: null,
				accessToken,
				saveAuthData,
				clearAuthData,
				isAuthenticated,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
