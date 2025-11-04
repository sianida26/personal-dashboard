/**
 * Notification helper functions
 * Provides simple wrappers for common notification patterns using the unified notification service
 */

import type {
	NotificationCategoryEnum,
	NotificationChannelEnum,
	NotificationTypeEnum,
} from "@repo/validation";
import unifiedNotificationService from "../../modules/notifications/unified-notification-service";
import type {
	UnifiedNotificationChannelOverrides,
	UnifiedNotificationResponse,
} from "../../modules/notifications/unified-notification-types";

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
	channelOverrides?: UnifiedNotificationChannelOverrides;
}

/**
 * Send notification to specific users and/or role codes
 * Simplified wrapper for the unified notification service
 */
export async function sendToUsersAndRoles(
	options: SendToUsersAndRolesOptions,
): Promise<UnifiedNotificationResponse> {
	const {
		userIds = [],
		roleCodes = [],
		category,
		type,
		title,
		message,
		channels = ["inApp", "email", "whatsapp"],
		metadata = {},
		priority = "normal",
		respectPreferences = true,
		channelOverrides,
	} = options;

	const normalizeRecipients = <T>(value?: T | T[]): T[] | undefined => {
		if (value === undefined) {
			return undefined;
		}
		if (Array.isArray(value)) {
			return value;
		}
		return [value];
	};

	const normalizedOverrides: UnifiedNotificationChannelOverrides | undefined =
		channelOverrides
			? {
				...channelOverrides,
				email: channelOverrides.email
					? {
						...channelOverrides.email,
						to: normalizeRecipients(channelOverrides.email.to),
						cc: normalizeRecipients(channelOverrides.email.cc),
						bcc: normalizeRecipients(channelOverrides.email.bcc),
					}
					: undefined,
			}
			: undefined;

	// Only send if there are recipients
	if (userIds.length === 0 && roleCodes.length === 0) {
		console.warn("sendToUsersAndRoles called with no recipients");
		return { results: [] };
	}

	try {
		return await unifiedNotificationService.sendNotification({
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
			channelOverrides: normalizedOverrides,
		});
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("No recipients resolved")
		) {
			console.warn(
				"sendToUsersAndRoles skipped: no recipients matched for roles/users",
			);
			return { results: [] };
		}
		throw error;
	}
}

/**
 * Send notification to specific users only
 */
export async function sendToUsers(
	userIds: string[],
	options: Omit<SendToUsersAndRolesOptions, "userIds" | "roleCodes">,
): Promise<UnifiedNotificationResponse> {
	return sendToUsersAndRoles({ ...options, userIds });
}

/**
 * Send notification to specific roles only
 */
export async function sendToRoles(
	roleCodes: string[],
	options: Omit<SendToUsersAndRolesOptions, "userIds" | "roleCodes">,
): Promise<UnifiedNotificationResponse> {
	return sendToUsersAndRoles({ ...options, roleCodes });
}
