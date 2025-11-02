/**
 * Notification helper functions
 * Provides simple wrappers for common notification patterns using the unified notification service
 */

import unifiedNotificationService from "../../modules/notifications/unified-notification-service";
import type {
	NotificationChannelEnum,
	NotificationCategoryEnum,
	NotificationTypeEnum,
} from "@repo/validation";

interface SendToUsersAndRolesOptions {
	userIds?: string[];
	roleCodes?: string[];
	category: NotificationCategoryEnum;
	type: NotificationTypeEnum;
	title: string;
	message: string;
	channels?: NotificationChannelEnum[];
	metadata?: Record<string, unknown>;
	priority?: "low" | "normal" | "high";
	respectPreferences?: boolean;
}

/**
 * Send notification to specific users and/or role codes
 * Simplified wrapper for the unified notification service
 */
export async function sendToUsersAndRoles(
	options: SendToUsersAndRolesOptions,
): Promise<void> {
	const {
		userIds = [],
		roleCodes = [],
		category,
		type,
		title,
		message,
		channels = ["inApp"],
		metadata = {},
		priority = "normal",
		respectPreferences = true,
	} = options;

	// Only send if there are recipients
	if (userIds.length === 0 && roleCodes.length === 0) {
		console.warn("sendToUsersAndRoles called with no recipients");
		return;
	}

	await unifiedNotificationService.sendNotification({
		userIds: userIds.length > 0 ? userIds : undefined,
		roleCodes: roleCodes.length > 0 ? roleCodes : undefined,
		category,
		notificationType: type,
		title,
		message,
		channels,
		metadata,
		priority: priority as "low" | "normal" | "high" | undefined,
		respectPreferences,
	});
}

/**
 * Send notification to specific users only
 */
export async function sendToUsers(
	userIds: string[],
	options: Omit<SendToUsersAndRolesOptions, "userIds" | "roleCodes">,
): Promise<void> {
	await sendToUsersAndRoles({ ...options, userIds });
}

/**
 * Send notification to specific roles only
 */
export async function sendToRoles(
	roleCodes: string[],
	options: Omit<SendToUsersAndRolesOptions, "userIds" | "roleCodes">,
): Promise<void> {
	await sendToUsersAndRoles({ ...options, roleCodes });
}
