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
	} | null;
	accessToken: string | null;
	saveAuthData: (
		userData: NonNullable<AuthContextType["user"]>,
		accessToken?: NonNullable<AuthContextType["accessToken"]>,
	) => void;
	clearAuthData: () => void;
	checkPermission: (permission: string) => boolean;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
