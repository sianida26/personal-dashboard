import type { CreateNotificationInput } from "@repo/validation";

export interface InAppNotificationJobPayload extends Record<string, unknown> {
	notification: CreateNotificationInput;
}
