import type { NotificationChannelEnum } from "@repo/validation";
import { inArray } from "drizzle-orm";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import { addSpanAttributes, addSpanEvent, withSpan } from "../../utils/tracing";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	NOTIFICATION_CHANNELS,
} from "../notification-preferences/constants";
import type { NotificationPreferenceSummary } from "../notification-preferences/notification-preferences-service";
import notificationPreferenceService, {
	type NotificationPreferenceService,
} from "../notification-preferences/notification-preferences-service";
import { EmailChannelAdapter } from "./channels/email-adapter";
import { InAppChannelAdapter } from "./channels/in-app-adapter";
import type { NotificationChannelAdapter } from "./channels/types";
import { WhatsAppChannelAdapter } from "./channels/whatsapp-adapter";
import createNotificationRepository from "./notification-repository";
import type {
	ChannelDispatchResult,
	NotificationRecipient,
	UnifiedNotificationRequest,
	UnifiedNotificationResponse,
} from "./unified-notification-types";

const DEFAULT_CHANNELS: NotificationChannelEnum[] = ["inApp"];

export class UnifiedNotificationService {
	private readonly notificationRepo = createNotificationRepository();
	private readonly preferenceService: NotificationPreferenceService;
	private readonly adapters: Map<
		NotificationChannelEnum,
		NotificationChannelAdapter
	>;

	constructor(
		options: {
			preferenceService?: NotificationPreferenceService;
			adapters?: NotificationChannelAdapter[];
		} = {},
	) {
		this.preferenceService =
			options.preferenceService ?? notificationPreferenceService;
		const adapterList = options.adapters ?? [
			new InAppChannelAdapter(),
			new EmailChannelAdapter(),
			new WhatsAppChannelAdapter(),
		];
		this.adapters = new Map(
			adapterList.map((adapter) => [adapter.channel, adapter]),
		);
	}

	async sendNotification(
		request: UnifiedNotificationRequest,
	): Promise<UnifiedNotificationResponse> {
		return withSpan(
			"notification.send",
			async () => {
				// Add span attributes for the notification request
				addSpanAttributes({
					"notification.category": request.category,
					"notification.channels.requested":
						request.channels?.join(",") || "default",
					"notification.respect_preferences":
						request.respectPreferences ?? true,
				});

				const channels = this.resolveChannels(request.channels);
				addSpanAttributes({
					"notification.channels.resolved": channels.join(","),
					"notification.channels.count": channels.length,
				});

				const userIds = await this.resolveAudience(request);
				if (!userIds.length) {
					addSpanEvent("notification.no_recipients");
					throw new Error(
						"No recipients resolved for unified notification",
					);
				}

				addSpanAttributes({
					"notification.recipients.count": userIds.length,
				});
				addSpanEvent("notification.recipients_resolved", {
					count: userIds.length,
				});

				const recipients = await this.fetchRecipients(userIds);
				const preferenceCache = new Map<
					string,
					NotificationPreferenceSummary
				>();
				const results: ChannelDispatchResult[] = [];

				for (const channel of channels) {
					const adapter = this.adapters.get(channel);
					if (!adapter) {
						addSpanEvent("notification.channel_adapter_missing", {
							channel,
						});
						continue;
					}

					const { allowed, skipped } =
						await this.partitionRecipientsByPreference(
							recipients,
							request.category,
							channel,
							request.respectPreferences ?? true,
							preferenceCache,
						);

					addSpanEvent("notification.channel_preferences_checked", {
						channel,
						allowed: allowed.length,
						skipped: skipped.length,
					});

					results.push(
						...skipped.map((recipient) => ({
							userId: recipient.userId,
							channel,
							status: "skipped" as const,
							reason: "Channel disabled by user preference",
						})),
					);

					if (!allowed.length) {
						addSpanEvent("notification.channel_no_recipients", {
							channel,
						});
						continue;
					}

					addSpanEvent("notification.channel_delivering", {
						channel,
						recipients: allowed.length,
					});

					const channelResults = await adapter.deliver({
						channel,
						recipients: allowed,
						request,
					});

					results.push(...channelResults);

					// Count success/failure for this channel
					const successes = channelResults.filter(
						(r) => r.status === "sent",
					).length;
					const failures = channelResults.filter(
						(r) => r.status === "failed",
					).length;

					addSpanEvent("notification.channel_completed", {
						channel,
						successes,
						failures,
					});
				}

				// Add final result summary
				const totalSuccess = results.filter(
					(r) => r.status === "sent",
				).length;
				const totalFailure = results.filter(
					(r) => r.status === "failed",
				).length;
				const totalSkipped = results.filter(
					(r) => r.status === "skipped",
				).length;

				addSpanAttributes({
					"notification.results.success": totalSuccess,
					"notification.results.failure": totalFailure,
					"notification.results.skipped": totalSkipped,
					"notification.results.total": results.length,
				});

				return { results };
			},
			{
				"notification.category": request.category,
			},
		);
	}

	private resolveChannels(channels?: NotificationChannelEnum[]) {
		if (!channels?.length) {
			return DEFAULT_CHANNELS;
		}
		const normalized = channels.filter((channel) =>
			NOTIFICATION_CHANNELS.includes(channel),
		);
		return normalized.length ? normalized : DEFAULT_CHANNELS;
	}

	private async resolveAudience(request: UnifiedNotificationRequest) {
		const recipients = new Set<string>();
		if (request.userId) {
			recipients.add(request.userId);
		}
		request.userIds?.forEach((id) => {
			if (id) recipients.add(id);
		});

		if (request.roleCodes?.length) {
			const idsFromRoles =
				await this.notificationRepo.findUserIdsByRoleCodes(
					request.roleCodes,
				);
			for (const id of idsFromRoles) recipients.add(id);
		}

		return Array.from(recipients);
	}

	private async fetchRecipients(
		userIds: string[],
	): Promise<NotificationRecipient[]> {
		const rows = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				phoneNumber: users.phoneNumber,
			})
			.from(users)
			.where(inArray(users.id, userIds));

		return rows.map((row) => ({
			userId: row.id,
			name: row.name,
			email: row.email ?? "",
			phoneNumber: row.phoneNumber ?? null,
		}));
	}

	private async partitionRecipientsByPreference(
		recipients: NotificationRecipient[],
		category: UnifiedNotificationRequest["category"],
		channel: NotificationChannelEnum,
		respectPreferences: boolean,
		cache: Map<string, NotificationPreferenceSummary>,
	) {
		if (!respectPreferences) {
			return {
				allowed: recipients,
				skipped: [] as NotificationRecipient[],
			};
		}

		const allowed: NotificationRecipient[] = [];
		const skipped: NotificationRecipient[] = [];

		for (const recipient of recipients) {
			const summary = await this.getPreferenceSummary(
				recipient.userId,
				cache,
			);
			const enabled = this.isChannelEnabled(summary, category, channel);
			if (enabled) {
				allowed.push(recipient);
			} else {
				skipped.push(recipient);
			}
		}

		return { allowed, skipped };
	}

	private async getPreferenceSummary(
		userId: string,
		cache: Map<string, NotificationPreferenceSummary>,
	) {
		if (cache.has(userId)) {
			return cache.get(userId) ?? ({} as NotificationPreferenceSummary);
		}

		const summary = await this.preferenceService.getUserPreferences(userId);
		cache.set(userId, summary);
		return summary;
	}

	private isChannelEnabled(
		summary: NotificationPreferenceSummary,
		category: UnifiedNotificationRequest["category"],
		channel: NotificationChannelEnum,
	) {
		// First check global preference - it acts as a master switch
		const globalPreference = summary.preferences.find(
			(item) => item.category === "global" && item.channel === channel,
		);

		// If global preference exists and is disabled, channel is disabled regardless of category-specific settings
		if (globalPreference && !globalPreference.effective) {
			return false;
		}

		// Then check category-specific preference
		const categoryPreference = summary.preferences.find(
			(item) => item.category === category && item.channel === channel,
		);

		if (categoryPreference) {
			return categoryPreference.effective;
		}

		// If global preference exists and is enabled, use it
		if (globalPreference) {
			return globalPreference.effective;
		}

		// Fall back to default matrix
		const fallback =
			DEFAULT_NOTIFICATION_PREFERENCE_MATRIX[category]?.[channel];
		if (typeof fallback === "boolean") {
			return fallback;
		}
		return DEFAULT_NOTIFICATION_PREFERENCE_MATRIX.global?.[channel] ?? true;
	}
}

const unifiedNotificationService = new UnifiedNotificationService();

export default unifiedNotificationService;
