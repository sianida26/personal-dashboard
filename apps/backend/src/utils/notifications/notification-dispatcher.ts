import NotificationOrchestrator from "../../modules/notifications/notification-orchestrator";
import jobQueueManager from "../../services/jobs/queue-manager";
import type { CreateJobOptions } from "../../services/jobs/types";
import type { NotificationChannel, NotificationJobPayload } from "../../types/notifications";

const notificationOrchestrator = new NotificationOrchestrator();

const DEFAULT_JOB_TYPE = "send-notification";
const KNOWN_QUEUE_CHANNELS = new Set<string>([
	"email",
	"whatsapp",
	"sms",
	"push",
	"slack",
]);

type ChannelOption = NotificationChannel | string;

export interface NotificationDispatchOptions {
	/** Channels to enable for this dispatch (defaults to all provided). */
	channels?: ChannelOption[];
	/** Queue priority when scheduling background notification processing. */
	jobPriority?: number;
	/** Maximum queue retries (falls back to handler default otherwise). */
	maxRetries?: number;
	/** Override the queue job type. Defaults to send-notification. */
	jobType?: string;
	/** Custom error handler when in-app notification creation fails. */
	onInAppError?: (error: unknown) => void;
}

const defaultInAppErrorLogger = (error: unknown) => {
	console.error("Failed to create in-app notification:", error);
};

const normalizeChannel = (channel: ChannelOption) => channel.toLowerCase();

export async function dispatchNotification(
	payload: NotificationJobPayload,
	options: NotificationDispatchOptions = {},
): Promise<void> {
	const {
		channels,
		jobPriority,
		maxRetries,
		jobType = DEFAULT_JOB_TYPE,
		onInAppError,
	} = options;

	const normalizedChannels = channels?.map(normalizeChannel);
	const logInAppError = onInAppError ?? defaultInAppErrorLogger;

	const inAppPayload = payload.inApp;
	const shouldSendInApp =
		Boolean(inAppPayload) &&
		(!normalizedChannels || normalizedChannels.includes("inapp"));

	const queuePayload: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(payload)) {
		if (key === "inApp" || value === undefined) {
			continue;
		}

		const normalizedKey = normalizeChannel(key);
		if (
			normalizedChannels &&
			KNOWN_QUEUE_CHANNELS.has(normalizedKey) &&
			!normalizedChannels.includes(normalizedKey)
		) {
			continue;
		}

		queuePayload[key] = value;
	}

	const hasQueueTransport = Object.entries(queuePayload).some(
		([key, value]) =>
			value !== undefined && KNOWN_QUEUE_CHANNELS.has(normalizeChannel(key)),
	);

	if (!shouldSendInApp && !hasQueueTransport) {
		return;
	}

	if (shouldSendInApp && inAppPayload) {
		try {
			await notificationOrchestrator.createNotification(inAppPayload);
		} catch (error) {
			logInAppError(error);
		}
	}

	if (!hasQueueTransport) {
		return;
	}

	const jobOptions: CreateJobOptions = {
		type: jobType,
		payload: queuePayload as NotificationJobPayload,
	};

	if (jobPriority !== undefined) {
		jobOptions.priority = jobPriority;
	}

	if (maxRetries !== undefined) {
		jobOptions.maxRetries = maxRetries;
	}

	await jobQueueManager.createJob(jobOptions);
}
