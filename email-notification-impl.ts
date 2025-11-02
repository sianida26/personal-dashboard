import { z } from "zod";
import type { JobHandler } from "../../services/jobs/types";
import emailService from "../../services/email/email-service";

const payloadSchema = z.object({
	to: z.array(z.string().email()).min(1),
	subject: z.string(),
	html: z.string(),
	text: z.string().optional(),
	cc: z.array(z.string().email()).optional(),
	bcc: z.array(z.string().email()).optional(),
});

type EmailNotificationPayload = z.infer<typeof payloadSchema>;

const emailNotificationHandler: JobHandler<EmailNotificationPayload> = {
	type: "email-notification",
	description: "Send email notifications using Nodemailer",
	defaultMaxRetries: 3,
	defaultTimeoutSeconds: 30,

	validate(payload: unknown): EmailNotificationPayload {
		return payloadSchema.parse(payload);
	},

	async execute(payload, context) {
		const { to, subject, html, text, cc, bcc } = payload;

		const recipientList = Array.isArray(to) ? to.join(", ") : to;
		context.logger.info(`Sending email to ${recipientList}`);

		try {
			const result = await emailService.sendEmail({
				to,
				subject,
				html,
				text,
				cc,
				bcc,
			});

			if (!result.success) {
				throw new Error(result.error || "Failed to send email");
			}

			context.logger.info(
				`Email sent successfully with message ID: ${result.messageId}`,
			);

			return {
				success: true,
				message: `Email sent to ${recipientList}`,
				data: { messageId: result.messageId, recipients: to },
			};
		} catch (error) {
			const errorMsg = new Error(
				`Failed to send email: ${(error as Error).message}`,
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
