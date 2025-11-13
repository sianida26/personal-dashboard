interface AuthBridge {
	getAccessToken: () => string | null;
	refreshSession: () => Promise<void>;
	clearAuthData: () => Promise<void>;
}

let bridge: AuthBridge | null = null;

export const setAuthBridge = (nextBridge: AuthBridge | null) => {
	bridge = nextBridge;
};

export const getAuthBridge = () => bridge;
