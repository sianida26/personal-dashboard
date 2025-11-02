import type {
	BulkUpsertNotificationPreferencesInput,
	NotificationCategoryEnum,
	NotificationChannelEnum,
	NotificationPreference,
	NotificationPreferenceSourceEnum,
	UpsertNotificationPreferenceInput,
} from "@repo/validation";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	DEFAULT_SOURCE,
	NOTIFICATION_CATEGORIES,
	NOTIFICATION_CHANNELS,
	OVERRIDE_SOURCE,
	USER_OVERRIDE_SOURCE,
} from "./constants";
import createNotificationPreferenceRepository, {
	type NotificationPreferenceRepository,
	type NotificationPreferenceUpsertInput,
} from "./notification-preferences-repository";
import type {
	NotificationChannelOverrideRecord,
	UserNotificationPreferenceRecord,
} from "../../drizzle/schema/notificationPreferences";

export interface NotificationPreferenceView
	extends Pick<NotificationPreference, "category" | "channel" | "enabled"> {
	defaultEnabled: boolean;
	effective: boolean;
	source: NotificationPreferenceSourceEnum;
	deliveryWindow?: UserNotificationPreferenceRecord["deliveryWindow"];
	override?: NotificationChannelOverrideRecord | null;
}

export interface NotificationPreferenceSummary {
	userId: string;
	preferences: NotificationPreferenceView[];
	metadata: {
		categories: NotificationCategoryEnum[];
		channels: NotificationChannelEnum[];
	};
}

export class NotificationPreferenceService {
	constructor(
		private readonly repository: NotificationPreferenceRepository =
			createNotificationPreferenceRepository(),
	) {}

	private resolveDefault(
		category: NotificationCategoryEnum,
		channel: NotificationChannelEnum,
	): boolean {
		return DEFAULT_NOTIFICATION_PREFERENCE_MATRIX[category]?.[channel] ?? false;
	}

	private toView(
		record: UserNotificationPreferenceRecord,
		overrides: NotificationChannelOverrideRecord[],
	): NotificationPreferenceView {
		const defaultEnabled = this.resolveDefault(
			record.category,
			record.channel,
		);
		const override = overrides.find(
			(item) =>
				item.category === record.category && item.channel === record.channel,
		);
		let effective = record.enabled;
		let source = record.source ?? DEFAULT_SOURCE;

		if (override) {
			effective = override.enforced;
			source = OVERRIDE_SOURCE;
		}

		return {
			category: record.category,
			channel: record.channel,
			enabled: record.enabled,
			defaultEnabled,
			effective,
			source,
			deliveryWindow: record.deliveryWindow ?? undefined,
			override: override ?? null,
		};
	}

	async getUserPreferences(userId: string): Promise<NotificationPreferenceSummary> {
		await this.repository.ensureDefaultsForUser(userId);
		const [preferences, overrides] = await Promise.all([
			this.repository.listPreferencesForUser(userId),
			this.repository.listOverrides(),
		]);

		const views = preferences.map((record) =>
			this.toView(record, overrides),
		);

		return {
			userId,
			preferences: views,
			metadata: {
				categories: [...NOTIFICATION_CATEGORIES],
				channels: [...NOTIFICATION_CHANNELS],
			},
		};
	}

	async updateUserPreferences(
		userId: string,
		payload: BulkUpsertNotificationPreferencesInput,
	): Promise<void> {
		if (!payload.preferences.length) {
			return;
		}

		await this.repository.ensureDefaultsForUser(userId);

		const updates = payload.preferences.map((preference) =>
			this.prepareUpsert(preference),
		);

		await this.repository.upsertPreferences(userId, updates);
	}

	private prepareUpsert(
		preference: UpsertNotificationPreferenceInput,
	): NotificationPreferenceUpsertInput {
		const defaultEnabled = this.resolveDefault(
			preference.category,
			preference.channel,
		);

		const source: NotificationPreferenceSourceEnum =
			preference.enabled === defaultEnabled && !preference.deliveryWindow
				? DEFAULT_SOURCE
				: USER_OVERRIDE_SOURCE;

		return {
			category: preference.category,
			channel: preference.channel,
			enabled: preference.enabled,
			deliveryWindow: preference.deliveryWindow ?? null,
			source,
		};
	}
}

const notificationPreferenceService = new NotificationPreferenceService();

export default notificationPreferenceService;
