import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";

const payloadSchema = z.object({
	userId: z.string(),
	template: z.string(),
	data: z.record(z.string(), z.unknown()).optional(),
});

type EmailNotificationPayload = z.infer<typeof payloadSchema>;

const emailNotificationHandler: JobHandler<EmailNotificationPayload> = {
	type: "email-notification",
	description: "Send email notifications to users",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	validate(payload: unknown): EmailNotificationPayload {
		return payloadSchema.parse(payload);
	},

	async execute(payload, context) {
		const { userId, template } = payload;

		context.logger.info(
			`Sending email notification to user ${userId} with template ${template}`,
		);

		try {
			// Simulate email sending
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// For demo purposes, randomly fail 10% of emails
			if (Math.random() < 0.1) {
				throw new Error("Email service temporarily unavailable");
			}

			context.logger.info(
				`Email notification sent successfully to user ${userId}`,
			);

			return {
				success: true,
				message: `Email sent to user ${userId}`,
				data: { userId, template },
			};
		} catch (error) {
			const errorMsg = new Error(
				`Failed to send email to user ${userId}: ${(error as Error).message}`,
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
			`Email notification failed permanently for job ${context.jobId}: ${error.message}`,
		);
		context.logger.error(errorMsg);
	},

	async onSuccess(_result, context) {
		context.logger.info(
			`Email notification completed successfully for job ${context.jobId}`,
		);
	},
};

export default emailNotificationHandler;
