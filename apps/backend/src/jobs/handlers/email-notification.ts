import { z } from "zod";
import emailService from "../../services/email/email-service";
import type { JobHandler } from "../../services/jobs/types";

const payloadSchema = z.object({
	to: z.union([z.email(), z.array(z.email())]).refine((val) => {
		const normalized = Array.isArray(val) ? val : [val];
		return normalized.length > 0;
	}),
	subject: z.string(),
	html: z.string(),
	text: z.string().optional(),
	cc: z.union([z.email(), z.array(z.email())]).optional(),
	bcc: z.union([z.email(), z.array(z.email())]).optional(),
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

		// Normalize email addresses to arrays
		const normalizedTo = Array.isArray(to) ? to : [to];
		const normalizedCc = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
		const normalizedBcc = bcc
			? Array.isArray(bcc)
				? bcc
				: [bcc]
			: undefined;

		const recipientList = normalizedTo.join(", ");
		context.logger.info(`Sending email to ${recipientList}`);

		try {
			const result = await emailService.sendEmail({
				to: normalizedTo,
				subject,
				html,
				text,
				cc: normalizedCc,
				bcc: normalizedBcc,
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
				data: { messageId: result.messageId, recipients: normalizedTo },
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
