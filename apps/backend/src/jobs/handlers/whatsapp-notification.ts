import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";
import whatsappService from "../../services/whatsapp/whatsapp-service";

const payloadSchema = z.object({
	phoneNumber: z.string().min(10),
	message: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

type WhatsAppNotificationPayload = z.infer<typeof payloadSchema>;

const whatsappNotificationHandler: JobHandler<WhatsAppNotificationPayload> = {
	type: "whatsapp-notification",
	description: "Send WhatsApp notifications using WAHA",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	validate(payload: unknown): WhatsAppNotificationPayload {
		return payloadSchema.parse(payload);
	},

	async execute(payload, context) {
		const { phoneNumber, message } = payload;

		context.logger.info(`Sending WhatsApp message to ${phoneNumber}`);

		try {
			const result = await whatsappService.sendMessage(
				phoneNumber,
				message,
			);

			if (!result.success) {
				throw new Error(
					result.error || "Failed to send WhatsApp message",
				);
			}

			context.logger.info(
				`WhatsApp message sent successfully to ${phoneNumber} with message ID: ${result.messageId}`,
			);

			return {
				success: true,
				message: `WhatsApp sent to ${phoneNumber}`,
				data: { messageId: result.messageId, phoneNumber, message },
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
