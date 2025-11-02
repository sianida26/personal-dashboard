/**
 * Lead notification service
 * Handles all notification operations for leads
 * Uses unified notification service for preference-aware delivery
 */

import unifiedNotificationService from "../../modules/notifications/unified-notification-service";
import { notificationTemplates } from "../notification-templates";

/**
 * Lead closed win notification data
 */
export interface LeadClosedWinNotificationData {
	leadId: string;
	dealName: string;
	companyName: string;
	salesId: string | null;
	salesName: string;
	salesEmail?: string;
	estimatedPrice: string;
	customerEmail: string;
	customerPhone: string;
	leadDetailUrl: string;
	sendToEmail: string;
	ccEmails: string[];
}

/**
 * Sales assignment notification data
 */
export interface SalesAssignmentNotificationData {
	leadId: string;
	dealName: string;
	companyName: string;
	salesId: string | null;
	salesName: string;
	salesEmail?: string;
	previousSalesId?: string | null;
	previousSalesName?: string;
	previousSalesEmail?: string;
	isUnassignment: boolean;
	estimatedPrice: string;
	customerEmail: string;
	customerPhone: string;
	leadDetailUrl: string;
	ccEmails?: string[];
}

/**
 * Presales assignment notification data
 */
export interface PresalesAssignmentNotificationData {
	leadId: string;
	dealName: string;
	companyName: string;
	salesName: string;
	presalesId: string | null;
	presalesName: string;
	presalesEmail?: string;
	presalesPhone?: string;
	previousPresalesId?: string | null;
	previousPresalesName?: string;
	previousPresalesEmail?: string;
	previousPresalesPhone?: string;
	isUnassignment: boolean;
	estimatedPrice: string;
	customerEmail: string;
	customerPhone: string;
	leadDetailUrl: string;
	ccEmails?: string[];
}

/**
 * Mention notification data for individual user
 */
export interface MentionNotificationData {
	userId: string;
	userName: string;
	userPhone?: string | null;
	leadId: string;
	companyName: string;
	commentId: string;
	commentText: string;
	actorName: string;
	leadDetailUrl: string;
}

/**
 * Send notification for lead closed win
 */
export async function sendLeadClosedWinNotification(
	data: LeadClosedWinNotificationData,
): Promise<void> {
	const {
		leadId,
		dealName,
		companyName,
		salesId,
		salesName,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
		sendToEmail,
		ccEmails,
	} = data;

	if (!salesId) {
		return;
	}

	// Generate template
	const template = notificationTemplates.lead.closedWin({
		dealName,
		companyName,
		salesName,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
	});

	// Send via unified notification service
	await unifiedNotificationService.sendNotification({
		userIds: [salesId],
		category: "leads",
		type: "closed_win",
		title: template.title,
		message: template.message,
		channels: ["inApp", "email"],
		metadata: {
			leadId,
			companyName,
			salesId,
			status: "Buy",
			emailTo: sendToEmail,
			emailCc: ccEmails,
			emailSubject: template.emailSubject ?? "Lead Closed Win",
			emailBody: template.emailBody ?? "",
		},
		priority: template.priority,
		respectPreferences: true,
	});
}

/**
 * Send notification for sales PIC assignment/unassignment
 */
export async function sendSalesAssignmentNotification(
	data: SalesAssignmentNotificationData,
): Promise<void> {
	const {
		leadId,
		dealName,
		companyName,
		salesId,
		salesName,
		salesEmail,
		previousSalesId,
		previousSalesName,
		previousSalesEmail,
		isUnassignment,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
		ccEmails = [],
	} = data;

	// Generate template
	const template = notificationTemplates.lead.salesAssignment({
		dealName,
		companyName,
		salesName,
		previousSalesName,
		isUnassignment,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
	});

	// Determine notification targets
	const targetUserId = isUnassignment ? previousSalesId : salesId;
	const targetUserEmail = isUnassignment ? previousSalesEmail : salesEmail;

	if (!targetUserId) {
		return;
	}

	// Send via unified notification service
	await unifiedNotificationService.sendNotification({
		userIds: [targetUserId],
		category: "leads",
		type: isUnassignment ? "sales_unassignment" : "sales_assignment",
		title: template.title,
		message: template.message,
		channels: ["inApp", "email"],
		metadata: {
			leadId,
			companyName,
			salesId: isUnassignment ? previousSalesId : salesId,
			action: `sales_${isUnassignment ? "unassigned" : "assigned"}`,
			emailTo: targetUserEmail,
			emailCc: ccEmails,
			emailSubject: template.emailSubject ??
				(isUnassignment ? "Lead Unassigned from Sales" : "Lead Assigned to Sales"),
			emailBody: template.emailBody ?? "",
		},
		priority: template.priority,
		respectPreferences: true,
	});
}

/**
 * Send notification for presales PIC assignment/unassignment
 */
export async function sendPresalesAssignmentNotification(
	data: PresalesAssignmentNotificationData,
): Promise<void> {
	const {
		leadId,
		dealName,
		companyName,
		salesName,
		presalesId,
		presalesName,
		presalesEmail,
		presalesPhone,
		previousPresalesId,
		previousPresalesName,
		previousPresalesEmail,
		previousPresalesPhone,
		isUnassignment,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
		ccEmails = [],
	} = data;

	// Generate template
	const template = notificationTemplates.lead.presalesAssignment({
		dealName,
		companyName,
		salesName,
		presalesName,
		previousPresalesName,
		isUnassignment,
		estimatedPrice,
		customerEmail,
		customerPhone,
		leadDetailUrl,
	});

	// Determine notification targets
	const targetUserId = isUnassignment ? previousPresalesId : presalesId;
	const targetUserEmail = isUnassignment
		? previousPresalesEmail
		: presalesEmail;
	const targetUserPhone = isUnassignment
		? previousPresalesPhone
		: presalesPhone;

	if (!targetUserId) {
		return;
	}

	// Send via unified notification service
	await unifiedNotificationService.sendNotification({
		userIds: [targetUserId],
		category: "leads",
		type: isUnassignment ? "presales_unassignment" : "presales_assignment",
		title: template.title,
		message: template.message,
		channels: ["inApp", "email", "whatsapp"],
		metadata: {
			leadId,
			companyName,
			presalesId: isUnassignment ? previousPresalesId : presalesId,
			action: `presales_${isUnassignment ? "unassigned" : "assigned"}`,
			emailTo: targetUserEmail,
			emailCc: ccEmails,
			emailSubject: template.emailSubject ??
				(isUnassignment ? "Lead Unassigned from Presales" : "Lead Assigned to Presales"),
			emailBody: template.emailBody ?? "",
			whatsappMessage: template.whatsappMessage,
			whatsappPhone: targetUserPhone,
		},
		priority: template.priority,
		respectPreferences: true,
	});
}

/**
 * Send notification when user is mentioned in a comment
 */
export async function sendMentionNotification(
	data: MentionNotificationData,
): Promise<void> {
	const {
		userId,
		userName,
		userPhone,
		leadId,
		companyName,
		commentId,
		commentText,
		actorName,
		leadDetailUrl,
	} = data;

	// Send via unified notification service
	await unifiedNotificationService.sendNotification({
		userIds: [userId],
		category: "leads",
		type: "mention",
		title: "You were mentioned in a lead comment",
		message: `${actorName} mentioned you in a comment on a lead for ${companyName}.`,
		channels: ["inApp", "whatsapp"],
		metadata: {
			leadId,
			commentId,
			commentText,
			actorName,
			companyName,
			linkHref: `/leads?id=${leadId}`,
			linkLabel: "Open Lead",
			whatsappMessage: `Hi ${userName}, ${actorName} mentioned you in a comment on a lead for ${companyName}.\n\nComment: "${commentText}"\n\nPlease check the lead details: ${leadDetailUrl}`,
			whatsappPhone: userPhone,
		},
		respectPreferences: true,
	});
}
