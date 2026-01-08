/**
 * Notification helper functions
 * Provides simple wrappers for common notification patterns using the unified notification service
 */

import type {
	NotificationCategoryEnum,
	NotificationChannelEnum,
	NotificationTypeEnum,
} from "@repo/validation";
import appEnv from "../../appEnv";
import unifiedNotificationService from "../../services/notifications/unified-notification-service";
import type {
	UnifiedNotificationChannelOverrides,
	UnifiedNotificationResponse,
} from "../../services/notifications/unified-notification-types";

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
 * Build channel overrides from environment variables if they are set
 * This allows overriding all notification recipients for testing/development
 */
function buildChannelOverridesFromEnv(
	userProvidedOverrides?: UnifiedNotificationChannelOverrides,
): UnifiedNotificationChannelOverrides | undefined {
	const overrideEmail = appEnv.NOTIFICATION_OVERRIDE_EMAIL;
	const overridePhone = appEnv.NOTIFICATION_OVERRIDE_PHONE;

	// If no override recipients are set in env, return user-provided overrides as-is
	if (!overrideEmail && !overridePhone) {
		return userProvidedOverrides;
	}

	// Start with user-provided overrides or empty object
	const overrides: UnifiedNotificationChannelOverrides = {
		...userProvidedOverrides,
	};

	// Add email override if set in env
	if (overrideEmail) {
		overrides.email = {
			...userProvidedOverrides?.email,
			to: overrideEmail,
		};
	}

	// Add whatsapp override if set in env
	if (overridePhone) {
		overrides.whatsapp = {
			...userProvidedOverrides?.whatsapp,
			phoneNumber: overridePhone,
		};
	}

	return overrides;
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

	// Build channel overrides from environment variables first
	const envOverrides = buildChannelOverridesFromEnv(channelOverrides);

	const normalizedOverrides: UnifiedNotificationChannelOverrides | undefined =
		envOverrides
			? {
					...envOverrides,
					email: envOverrides.email
						? {
								...envOverrides.email,
								to: normalizeRecipients(envOverrides.email.to),
								cc: normalizeRecipients(envOverrides.email.cc),
								bcc: normalizeRecipients(
									envOverrides.email.bcc,
								),
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
			priority,
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
