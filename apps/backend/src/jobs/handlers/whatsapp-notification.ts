import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";
import whatsappService from "../../services/whatsapp/whatsapp-service";

const payloadSchema = z.object({
	phoneNumber: z.union([z.string(), z.number()]),
	message: z.string(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	session: z.string().optional(),
	linkPreview: z.boolean().optional(),
	linkPreviewHighQuality: z.boolean().optional(),
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
		const {
			phoneNumber,
			message,
			session,
			linkPreview,
			linkPreviewHighQuality,
		} = payload;

		context.logger.info(`Sending WhatsApp message to ${phoneNumber}`);

		try {
			const result = await whatsappService.sendNotification({
				phoneNumber:
					typeof phoneNumber === "number"
						? String(phoneNumber)
						: phoneNumber,
				message,
				session,
				linkPreview,
				linkPreviewHighQuality,
			});

			if (!result.success) {
				throw new Error(
					result.message || "Failed to send WhatsApp message",
				);
			}

			context.logger.info(
				`WhatsApp message sent successfully to ${phoneNumber}`,
			);

			return {
				success: true,
				message: `WhatsApp sent to ${phoneNumber}`,
				data: { phoneNumber, message, response: result.data },
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
