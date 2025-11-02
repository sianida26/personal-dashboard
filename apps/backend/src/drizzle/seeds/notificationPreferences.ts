import { createId } from "@paralleldrive/cuid2";
import db from "../index";
import { users } from "../schema/users";
import {
	DEFAULT_NOTIFICATION_PREFERENCE_MATRIX,
	DEFAULT_SOURCE,
	NOTIFICATION_CATEGORIES,
	NOTIFICATION_CHANNELS,
} from "../../modules/notification-preferences/constants";
import {
	notificationPreferenceCategoryEnum,
	userNotificationPreferences,
} from "../schema/notificationPreferences";

type NotificationCategory =
	(typeof notificationPreferenceCategoryEnum.enumValues)[number];
type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

const notificationPreferencesSeeder = async () => {
	const existingCount = await db.$count(userNotificationPreferences);
	if (Number(existingCount) > 0) {
		return;
	}

	const allUsers = await db
		.select({ id: users.id })
		.from(users);

	if (!allUsers.length) {
		return;
	}

	const rows: (typeof userNotificationPreferences.$inferInsert)[] = [];
	const categoriesToSeed = NOTIFICATION_CATEGORIES.filter(
		(category): category is NotificationCategory => category !== "global",
	);

	for (const { id: userId } of allUsers) {
		for (const category of categoriesToSeed) {
			const channelMatrix = DEFAULT_NOTIFICATION_PREFERENCE_MATRIX[category];
			for (const channel of NOTIFICATION_CHANNELS) {
				const enabled = channelMatrix?.[channel as keyof typeof channelMatrix] ?? false;
				rows.push({
					id: createId(),
					userId,
					category,
					channel: channel as NotificationChannel,
					enabled,
					source: DEFAULT_SOURCE,
				});
			}
		}
	}

	if (rows.length) {
		await db
			.insert(userNotificationPreferences)
			.values(rows)
			.onConflictDoNothing();
	}
};

export default notificationPreferencesSeeder;
