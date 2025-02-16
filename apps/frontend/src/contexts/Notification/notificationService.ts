import type { Notification } from "./NotificationContext";

let showNotification: (notification: Omit<Notification, "id">) => void;

export const setShowNotification = (fn: typeof showNotification) => {
    showNotification = fn;
};

export const notifications = {
    show: (notification: Omit<Notification, "id">) => {
        if (!showNotification) {
            throw new Error("NotificationProvider is not initialized");
        }
        showNotification(notification);
    },
};