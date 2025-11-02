import { inArray } from "drizzle-orm";
import db from "../../drizzle";
import { users } from "../../drizzle/schema/users";
import createNotificationRepository from "./notification-repository";
import notificationPreferenceService, {
	type NotificationPreferenceService,
} from "../notification-preferences/notification-preferences-service";
import type {
	NotificationPreferenceSummary,
	NotificationPreferenceView,
} from "../notification-preferences/notification-preferences-service";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	NOTIFICATION_CHANNELS,
} from "../notification-preferences/constants";
import { InAppChannelAdapter } from "./channels/in-app-adapter";
import { EmailChannelAdapter } from "./channels/email-adapter";
import { WhatsAppChannelAdapter } from "./channels/whatsapp-adapter";
import type { NotificationChannelAdapter } from "./channels/types";
import type {
	ChannelDispatchResult,
	NotificationRecipient,
	UnifiedNotificationRequest,
	UnifiedNotificationResponse,
} from "./unified-notification-types";
import type { NotificationChannelEnum } from "@repo/validation";

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
		const channels = this.resolveChannels(request.channels);
		const userIds = await this.resolveAudience(request);
		if (!userIds.length) {
			throw new Error("No recipients resolved for unified notification");
		}

		const recipients = await this.fetchRecipients(userIds);
		const preferenceCache = new Map<
			string,
			NotificationPreferenceSummary
		>();
		const results: ChannelDispatchResult[] = [];

		for (const channel of channels) {
			const adapter = this.adapters.get(channel);
			if (!adapter) {
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

			results.push(
				...skipped.map((recipient) => ({
					userId: recipient.userId,
					channel,
					status: "skipped" as const,
					reason: "Channel disabled by user preference",
				})),
			);

			if (!allowed.length) {
				continue;
			}

			const channelResults = await adapter.deliver({
				channel,
				recipients: allowed,
				request,
			});

			results.push(...channelResults);
		}

		return { results };
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
			})
			.from(users)
			.where(inArray(users.id, userIds));

		return rows.map((row) => ({
			userId: row.id,
			name: row.name,
			email: row.email ?? "",
			phoneNumber: null, // Phone number not available in minimal template
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
		const preference = this.findPreference(
			summary.preferences,
			category,
			channel,
		);
		if (preference) {
			return preference.effective;
		}
		const fallback =
			DEFAULT_NOTIFICATION_PREFERENCE_MATRIX[category]?.[channel];
		if (typeof fallback === "boolean") {
			return fallback;
		}
		return DEFAULT_NOTIFICATION_PREFERENCE_MATRIX.global?.[channel] ?? true;
	}

	private findPreference(
		preferences: NotificationPreferenceView[],
		category: UnifiedNotificationRequest["category"],
		channel: NotificationChannelEnum,
	) {
		const byCategory = preferences.find(
			(item) => item.category === category && item.channel === channel,
		);
		if (byCategory) {
			return byCategory;
		}
		return preferences.find(
			(item) => item.category === "global" && item.channel === channel,
		);
	}
}

const unifiedNotificationService = new UnifiedNotificationService();

export default unifiedNotificationService;
