import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";

const payloadSchema = z.object({
	phoneNumber: z.string(),
	message: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

type WhatsAppNotificationPayload = z.infer<typeof payloadSchema>;

const whatsappNotificationHandler: JobHandler<WhatsAppNotificationPayload> = {
	type: "whatsapp-notification",
	description: "Send WhatsApp notifications to users",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	validate(payload: unknown): WhatsAppNotificationPayload {
		return payloadSchema.parse(payload);
	},

	async execute(payload, context) {
		const { phoneNumber, message } = payload;

		context.logger.info(
			`Sending WhatsApp notification to ${phoneNumber}`,
		);

		try {
			// TODO: Implement real WhatsApp delivery via WAHA or Twilio
			// For now, using mock implementation

			// Mock implementation: simulate sending
			await new Promise((resolve) => setTimeout(resolve, 500));

			// For demo purposes, randomly fail 5% of messages
			if (Math.random() < 0.05) {
				throw new Error("WhatsApp service temporarily unavailable");
			}

			context.logger.info(
				`WhatsApp notification sent successfully to ${phoneNumber}`,
			);

			return {
				success: true,
				message: `WhatsApp message sent to ${phoneNumber}`,
				data: { phoneNumber, message },
			};
		} catch (error) {
			const errorMsg = new Error(
				`Failed to send WhatsApp to ${phoneNumber}: ${(error as Error).message}`,
			);
			context.logger.error(errorMsg);

			return {
				success: false,
				message: (error as Error).message,
				shouldRetry: true,
			};
		}
	},

	async onFailure(error, context) {
		const errorMsg = new Error(
			`WhatsApp notification failed permanently for job ${context.jobId}: ${error.message}`,
		);
		context.logger.error(errorMsg);
	},

	async onSuccess(_result, context) {
		context.logger.info(
			`WhatsApp notification completed successfully for job ${context.jobId}`,
		);
	},
};

export default whatsappNotificationHandler;
