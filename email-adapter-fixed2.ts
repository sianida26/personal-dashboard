import type {
	EmailNotificationPayload,
	NotificationJobPayload,
} from "../../../types/notifications";
import jobQueueManager from "../../../services/jobs/queue-manager";
import type {
	ChannelDeliveryRequest,
	NotificationChannelAdapter,
} from "./types";

const JOB_TYPE = "email-notification" as const;

// Simple HTML template for notifications
function createEmailHtml(
	title: string,
	message: string,
	metadata?: Record<string, unknown>,
): string {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
						line-height: 1.6;
						color: #333;
					}
					.container {
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
					}
					.header {
						border-bottom: 2px solid #007bff;
						padding-bottom: 10px;
						margin-bottom: 20px;
					}
					.header h1 {
						margin: 0;
						color: #007bff;
						font-size: 24px;
					}
					.content {
						margin: 20px 0;
					}
					.footer {
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #eee;
						font-size: 12px;
						color: #666;
					}
					.category {
						display: inline-block;
						background-color: #f0f0f0;
						padding: 4px 8px;
						border-radius: 4px;
						margin-top: 10px;
						font-size: 12px;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>${title}</h1>
					</div>
					<div class="content">
						<p>${message}</p>
						${metadata && metadata.category ? `<span class="category">Category: ${metadata.category}</span>` : ""}
					</div>
					<div class="footer">
						<p>This is an automated notification. Please do not reply to this email.</p>
					</div>
				</div>
			</body>
		</html>
	`;
}

export class EmailChannelAdapter implements NotificationChannelAdapter {
	readonly channel = "email" as const;

	async deliver({ channel, recipients, request }: ChannelDeliveryRequest) {
		if (channel !== this.channel || !recipients.length) {
			return [];
		}

		const override = request.channelOverrides?.email ?? {};

		const recipientEmails = override.to
			? Array.isArray(override.to)
				? override.to
				: [override.to]
			: recipients
					.map((recipient) => recipient.email)
					.filter((email): email is string => Boolean(email));

		const uniqueEmails = Array.from(new Set(recipientEmails));

		if (!uniqueEmails.length) {
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "skipped" as const,
				reason: "No email address available",
			}));
		}

		const subject = override.subject ?? request.title;
		const message = request.message; // Use request message, not override
		const metadata = {
			category: request.category,
			eventType: request.eventType,
			...(request.metadata ?? {}),
			...(override.metadata ?? {}),
		};

		// Create HTML email from message
		const html = createEmailHtml(subject, message, metadata);

		const emailPayload: EmailNotificationPayload = {
			to: uniqueEmails,
			cc: override.cc,
			subject,
			html,
			bcc: override.bcc,
			text: message,
		};

		const payload: NotificationJobPayload = {
			email: emailPayload,
		};

		const jobOptions = {
			type: request.jobOptions?.jobType ?? JOB_TYPE,
			payload: payload as unknown as Record<string, unknown>,
			priority: request.jobOptions?.priority,
			maxRetries: request.jobOptions?.maxRetries,
		};

		try {
			const jobId = await jobQueueManager.createJob(jobOptions);

			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "scheduled" as const,
				jobId,
			}));
		} catch (error) {
			return recipients.map((recipient) => ({
				userId: recipient.userId,
				channel: this.channel,
				status: "failed" as const,
				reason: error instanceof Error ? error.message : "Unknown error",
			}));
		}
	}
}

export default EmailChannelAdapter;
