import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { authDB } from "@/indexedDB/authDB";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";
import type { Notification as BackendNotification } from "@/modules/notifications/types";
import {
	type Notification,
	NotificationContext,
	useNotification,
} from "./NotificationContext";
import { setShowNotification } from "./notificationService";

export const NotificationHandler = ({ children }: { children: ReactNode }) => {
	const { show } = useNotification();

	setShowNotification(show); // Assign show function for external use

	return <>{children}</>;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const queryClient = useQueryClient();

	const show = useCallback((notification: Omit<Notification, "id">) => {
		const title = notification.title ?? "Notification";
		const description = notification.message ?? "";
		toast(title, {
			description,
			duration: 5000,
			dismissible: true,
		});

		if (typeof window !== "undefined" && "Notification" in window) {
			if (Notification.permission === "granted") {
				try {
					new Notification(title, { body: description });
				} catch (error) {
					console.error("Failed to show browser notification", error);
				}
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined" && "Notification" in window) {
			if (Notification.permission === "default") {
				Notification.requestPermission().catch((error) => {
					console.error(
						"Notification permission request failed",
						error,
					);
				});
			}
		}
	}, []);

	const remove = (id: string) => {
		setNotifications((current) => current.filter((n) => n.id !== id));
	};

	useEffect(() => {
		let source: EventSource | null = null;
		let stopped = false;

		const connect = async () => {
			const auth = await authDB.auth.get("auth");
			if (stopped) return;
			if (!auth?.accessToken) {
				setTimeout(connect, 5000);
				return;
			}

			const url = new URL(
				"/notifications/stream",
				(import.meta.env.VITE_BACKEND_BASE_URL || window.location.origin),
			);
			url.searchParams.set("token", auth.accessToken);

			source = new EventSource(url.toString());

			source.addEventListener("notification", (event) => {
				if (event?.data) {
					try {
						const payload = JSON.parse(
							event.data,
						) as BackendNotification;
						show({
							title: payload.title,
							message: payload.message,
						});
					} catch (error) {
						console.error(
							"Failed to parse notification payload",
							error,
						);
					}
				}

				queryClient.invalidateQueries({
					queryKey: notificationQueryKeys.all,
					exact: false,
				});
				queryClient.invalidateQueries({
					queryKey: notificationQueryKeys.unreadCount,
				});
			});

			source.onerror = () => {
				source?.close();
				if (!stopped) {
					setTimeout(connect, 5000);
				}
			};
		};

		connect();

		return () => {
			stopped = true;
			source?.close();
		};
	}, [queryClient, show]);

	return (
		<NotificationContext.Provider value={{ notifications, show, remove }}>
			<NotificationHandler>{children}</NotificationHandler>
			{/* Render Notifications */}
			<Toaster position="top-right" />
		</NotificationContext.Provider>
	);
};
