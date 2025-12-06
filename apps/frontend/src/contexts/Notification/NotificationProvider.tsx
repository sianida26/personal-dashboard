import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
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

	return (
		<NotificationContext.Provider value={{ notifications, show, remove }}>
			<NotificationHandler>{children}</NotificationHandler>
			{/* Render Notifications */}
			<Toaster position="top-right" />
		</NotificationContext.Provider>
	);
};
