import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import db from "../../drizzle";
import {
	notificationChannelOverrides,
	userNotificationPreferences,
	type NotificationChannelOverrideRecord,
	type UserNotificationPreferenceRecord,
} from "../../drizzle/schema/notificationPreferences";
import type {
	NotificationCategoryEnum,
	NotificationChannelEnum,
	NotificationPreferenceSourceEnum,
} from "@repo/validation";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	DEFAULT_SOURCE,
	NOTIFICATION_CATEGORIES,
	NOTIFICATION_CHANNELS,
} from "./constants";

export interface NotificationPreferenceUpsertInput {
	category: NotificationCategoryEnum;
	channel: NotificationChannelEnum;
	enabled: boolean;
	deliveryWindow?: UserNotificationPreferenceRecord["deliveryWindow"];
	source?: NotificationPreferenceSourceEnum;
}

export interface NotificationPreferenceRepository {
	ensureDefaultsForUser: (userId: string) => Promise<void>;
	listPreferencesForUser: (
		userId: string,
	) => Promise<UserNotificationPreferenceRecord[]>;
	listOverrides: () => Promise<NotificationChannelOverrideRecord[]>;
	upsertPreferences: (
		userId: string,
		payload: NotificationPreferenceUpsertInput[],
	) => Promise<void>;
}

const preferenceKey = (
	category: NotificationCategoryEnum,
	channel: NotificationChannelEnum,
) => `${category}:${channel}`;

export const createNotificationPreferenceRepository = (
	database: typeof db = db,
): NotificationPreferenceRepository => {
	const ensureDefaultsForUser: NotificationPreferenceRepository["ensureDefaultsForUser"] =
		async (userId) => {
			const existing = await database
				.select({
					category: userNotificationPreferences.category,
					channel: userNotificationPreferences.channel,
				})
				.from(userNotificationPreferences)
				.where(eq(userNotificationPreferences.userId, userId));

			const existingKeys = new Set(
				existing.map((record) =>
					preferenceKey(record.category, record.channel),
				),
			);

			const rows: (typeof userNotificationPreferences.$inferInsert)[] =
				[];

			for (const category of NOTIFICATION_CATEGORIES) {
				const matrix = DEFAULT_NOTIFICATION_PREFERENCE_MATRIX[category];
				for (const channel of NOTIFICATION_CHANNELS) {
					const key = preferenceKey(category, channel);
					if (existingKeys.has(key)) {
						continue;
					}

					const enabled = matrix?.[channel] ?? false;
					rows.push({
						id: createId(),
						userId,
						category,
						channel,
						enabled,
						source: DEFAULT_SOURCE,
					});
				}
			}

			if (rows.length === 0) {
				return;
			}

			await database
				.insert(userNotificationPreferences)
				.values(rows)
				.onConflictDoNothing({
					target: [
						userNotificationPreferences.userId,
						userNotificationPreferences.category,
						userNotificationPreferences.channel,
					],
				});
		};

	const listPreferencesForUser: NotificationPreferenceRepository["listPreferencesForUser"] =
		async (userId) => {
			return database
				.select()
				.from(userNotificationPreferences)
				.where(eq(userNotificationPreferences.userId, userId));
		};

	const listOverrides: NotificationPreferenceRepository["listOverrides"] =
		async () => {
			return database.select().from(notificationChannelOverrides);
		};

	const upsertPreferences: NotificationPreferenceRepository["upsertPreferences"] =
		async (userId, payload) => {
			if (!payload.length) {
				return;
			}

			const values = payload.map((item) => ({
				id: createId(),
				userId,
				category: item.category,
				channel: item.channel,
				enabled: item.enabled,
				deliveryWindow: item.deliveryWindow ?? null,
				source: (item.source ??
					"user") as NotificationPreferenceSourceEnum,
				updatedAt: new Date(),
			}));

			await database
				.insert(userNotificationPreferences)
				.values(values)
				.onConflictDoUpdate({
					target: [
						userNotificationPreferences.userId,
						userNotificationPreferences.category,
						userNotificationPreferences.channel,
					],
					set: {
						enabled: sql`excluded.enabled`,
						deliveryWindow: sql`excluded.delivery_window`,
						source: sql`excluded.source`,
						updatedAt: sql`excluded.updated_at`,
					},
				});
		};

	return {
		ensureDefaultsForUser,
		listPreferencesForUser,
		listOverrides,
		upsertPreferences,
	};
};

export default createNotificationPreferenceRepository;
