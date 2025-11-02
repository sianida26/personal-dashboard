import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export interface EmailOptions {
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string;
}

export class EmailService {
	private transporter: nodemailer.Transporter | null = null;
	private isConfigured = false;

	constructor() {
		this.initialize();
	}

	private initialize(): void {
		const smtpHost = process.env.SMTP_HOST;
		const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;

		if (!smtpHost || !smtpUser || !smtpPass) {
			console.warn(
				"Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
			);
			return;
		}

		this.transporter = nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure: smtpPort === 465,
			auth: {
				user: smtpUser,
				pass: smtpPass,
			},
		} as SMTPTransport.Options);

		this.isConfigured = true;
	}

	async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
		if (!this.isConfigured || !this.transporter) {
			return {
				success: false,
				error: "Email service not configured",
			};
		}

		try {
			const fromName = process.env.SMTP_FROM_NAME || "Dashboard";
			const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@example.com";
			const from = `${fromName} <${fromEmail}>`;

			const info = await this.transporter.sendMail({
				from,
				to: options.to,
				cc: options.cc,
				bcc: options.bcc,
				subject: options.subject,
				text: options.text,
				html: options.html,
				replyTo: options.replyTo,
			});

			return {
				success: true,
				messageId: info.messageId,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	async verifyConnection(): Promise<boolean> {
		if (!this.isConfigured || !this.transporter) {
			return false;
		}

		try {
			await this.transporter.verify();
			return true;
		} catch (error) {
			console.error("Email service verification failed:", error);
			return false;
		}
	}
}

const emailService = new EmailService();

export default emailService;
