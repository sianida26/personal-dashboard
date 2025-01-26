import { createContext, useContext } from "react";

export interface Notification {
	id?: string;
	title?: string;
	message: string;
	color?: string; // Optional, for styling
}

interface NotificationContextValue {
	notifications: Notification[];
	show: (notification: Omit<Notification, "id">) => void;
	remove: (id: string) => void;
}

export const NotificationContext = createContext<
	NotificationContextValue | undefined
>(undefined);

export const useNotification = () => {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error(
			"useNotification must be used within a NotificationProvider",
		);
	}
	return context;
};
