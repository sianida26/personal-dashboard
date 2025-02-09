import type { ReactNode } from "@tanstack/react-router";
import { useState } from "react";
import {
	type Notification,
	NotificationContext,
	useNotification,
} from "./NotificationContext";
import { useToast } from "@repo/ui/hooks";
import { Toaster } from "@repo/ui";

let showNotification: (notification: Omit<Notification, "id">) => void;

export const NotificationHandler = ({ children }: { children: ReactNode }) => {
	const { show } = useNotification();

	showNotification = show; // Assign show function for external use

	return <>{children}</>;
};

export const notifications = {
	show: (notification: Omit<Notification, "id">) => {
		if (!showNotification) {
			throw new Error("NotificationProvider is not initialized");
		}
		showNotification(notification);
	},
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const { toast } = useToast();

	const show = (notification: Omit<Notification, "id">) => {
		toast({
			description: notification.message,
		});
	};

	const remove = (id: string) => {
		setNotifications((current) => current.filter((n) => n.id !== id));
	};

	return (
		<NotificationContext.Provider value={{ notifications, show, remove }}>
			<NotificationHandler>{children}</NotificationHandler>
			{/* Render Notifications */}
			<Toaster />
		</NotificationContext.Provider>
	);
};
