import { createContext } from "react";

export interface AuthContextType {
	user: {
		id: string;
		name: string;
		profilePictureUrl?: string;
		email?: string;
		username?: string;
		permissions: string[];
		roles: string[];
		isAdmin?: boolean;
	} | null;
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: number | null;
	saveAuthData: (
		userData: NonNullable<AuthContextType["user"]>,
		tokens?: {
			accessToken?: string | null;
			refreshToken?: string | null;
		},
	) => Promise<void>;
	clearAuthData: () => Promise<void>;
	checkPermission: (permission: string) => boolean;
	isAuthenticated: boolean;
	refreshSession: () => Promise<void>;
	isRefreshing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
