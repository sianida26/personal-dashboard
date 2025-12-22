import type { ColorScheme, ThemeMode } from "@repo/validation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { DEFAULT_THEME_CONFIG } from "@/config/theme.config";
import client from "@/honoClient";
import useAuth from "@/hooks/useAuth";
import { themeDB } from "@/indexedDB/themeDB";

interface ThemeContextType {
	themeMode: ThemeMode;
	colorScheme: ColorScheme;
	setThemeMode: (mode: ThemeMode) => void;
	setColorScheme: (scheme: ColorScheme) => void;
	isLoading: boolean;
	isSyncing: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const { user } = useAuth();
	const userId = user?.id;
	const [themeMode, setThemeModeState] = useState<ThemeMode>(
		DEFAULT_THEME_CONFIG.themeMode,
	);
	const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
		DEFAULT_THEME_CONFIG.colorScheme,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
	const isInitializedRef = useRef(false);

	// Initialize theme from IndexedDB
	useEffect(() => {
		(async () => {
			try {
				const stored = await themeDB.theme.get("theme");
				if (stored) {
					setThemeModeState(stored.themeMode);
					setColorSchemeState(stored.colorScheme);
					applyColorScheme(stored.colorScheme);
				}
			} catch (error) {
				console.error("Failed to load theme from IndexedDB:", error);
			} finally {
				setIsLoading(false);
				isInitializedRef.current = true;
			}
		})();
	}, []);

	// Sync with backend when user logs in
	useEffect(() => {
		if (!userId || !isInitializedRef.current) return;

		(async () => {
			try {
				setIsSyncing(true);
				// @ts-expect-error - Theme route types not yet generated
				const response = await client.users["me"]["theme"].$get();

				if (response.ok) {
					const data = await response.json();
					const { themeMode: mode, colorScheme: scheme } = data;
					setThemeModeState(mode);
					setColorSchemeState(scheme);
					applyColorScheme(scheme);

					// Save to IndexedDB
					await themeDB.theme.put({
						id: "theme",
						themeMode: mode,
						colorScheme: scheme,
						updatedAt: Date.now(),
					});
				}
			} catch (error) {
				console.error("Failed to sync theme with backend:", error);
			} finally {
				setIsSyncing(false);
			}
		})();
	}, [userId]);

	// Cross-tab synchronization
	useEffect(() => {
		if (typeof BroadcastChannel === "undefined") return;

		const channel = new BroadcastChannel("theme-sync");
		broadcastChannelRef.current = channel;

		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "theme-changed") {
				setThemeModeState(event.data.themeMode);
				setColorSchemeState(event.data.colorScheme);
				applyColorScheme(event.data.colorScheme);
			}
		};

		channel.addEventListener("message", handleMessage);

		return () => {
			channel.removeEventListener("message", handleMessage);
			channel.close();
		};
	}, []);

	// Apply color scheme to document
	const applyColorScheme = useCallback((scheme: ColorScheme) => {
		document.documentElement.setAttribute("data-color-scheme", scheme);
	}, []);

	// Set theme mode
	const setThemeMode = useCallback(
		async (mode: ThemeMode) => {
			setThemeModeState(mode);

			try {
				// Save to IndexedDB
				const stored = await themeDB.theme.get("theme");
				await themeDB.theme.put({
					id: "theme",
					themeMode: mode,
					colorScheme: stored?.colorScheme || colorScheme,
					updatedAt: Date.now(),
				});

				// Broadcast to other tabs
				broadcastChannelRef.current?.postMessage({
					type: "theme-changed",
					themeMode: mode,
					colorScheme: stored?.colorScheme || colorScheme,
				});

				// Sync with backend if user is logged in
				if (userId) {
					// @ts-expect-error - Theme route types not yet generated
					await client.users["me"]["theme"].$patch({
						json: { themeMode: mode },
					});
				}
			} catch (error) {
				console.error("Failed to save theme mode:", error);
				toast.error("Failed to save theme preference");
			}
		},
		[userId, colorScheme],
	);

	// Set color scheme
	const setColorScheme = useCallback(
		async (scheme: ColorScheme) => {
			setColorSchemeState(scheme);
			applyColorScheme(scheme);

			try {
				// Save to IndexedDB
				const stored = await themeDB.theme.get("theme");
				await themeDB.theme.put({
					id: "theme",
					themeMode: stored?.themeMode || themeMode,
					colorScheme: scheme,
					updatedAt: Date.now(),
				});

				// Broadcast to other tabs
				broadcastChannelRef.current?.postMessage({
					type: "theme-changed",
					themeMode: stored?.themeMode || themeMode,
					colorScheme: scheme,
				});

				// Sync with backend if user is logged in
				if (userId) {
					// @ts-expect-error - Theme route types not yet generated
					await client.users["me"]["theme"].$patch({
						json: { colorScheme: scheme },
					});
				}
			} catch (error) {
				console.error("Failed to save color scheme:", error);
				toast.error("Failed to save color scheme");
			}
		},
		[userId, themeMode, applyColorScheme],
	);

	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme={themeMode}
			enableSystem
			disableTransitionOnChange
		>
			<ThemeContext.Provider
				value={{
					themeMode,
					colorScheme,
					setThemeMode,
					setColorScheme,
					isLoading,
					isSyncing,
				}}
			>
				{children}
			</ThemeContext.Provider>
		</NextThemesProvider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return context;
}
