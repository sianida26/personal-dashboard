import { eq } from "drizzle-orm";
import db from "../../drizzle";
import { microsoftUsers } from "../../drizzle/schema/users";
import { refreshAccessToken, createGraphClientForUser } from "./graphClient";

/**
 * Get a Microsoft Graph client for a user
 * @param userId The internal user ID in our system
 * @returns A Microsoft Graph client or null if the user doesn't have a Microsoft account
 */
export async function getGraphClientForUser(userId: string) {
	try {
		// Find the user's Microsoft account
		const microsoftAccount = await db.query.microsoftUsers.findFirst({
			where: eq(microsoftUsers.userId, userId),
		});

		if (!microsoftAccount) {
			return null;
		}

		// Refresh the access token if needed
		const accessToken = await refreshAccessToken(
			microsoftAccount.microsoftId,
			microsoftAccount.accessToken,
		);

		// Update the access token in the database if it changed
		if (accessToken !== microsoftAccount.accessToken) {
			await db
				.update(microsoftUsers)
				.set({ accessToken })
				.where(eq(microsoftUsers.id, microsoftAccount.id));
		}

		// Create and return the Graph client
		return createGraphClientForUser(accessToken);
	} catch (error) {
		console.error("Error getting Graph client for user:", error);
		return null;
	}
}

/**
 * Get user profile information from Microsoft Graph
 * @param userId The internal user ID in our system
 * @returns The user's Microsoft profile or null if not found
 */
export async function getUserProfile(userId: string) {
	try {
		const graphClient = await getGraphClientForUser(userId);

		if (!graphClient) {
			return null;
		}

		return await graphClient
			.api("/me")
			.select("id,displayName,mail,userPrincipalName,jobTitle")
			.get();
	} catch (error) {
		console.error("Error getting user profile:", error);
		return null;
	}
}

/**
 * Get the user's calendar events
 * @param userId The internal user ID in our system
 * @param startDateTime Start date time in ISO format
 * @param endDateTime End date time in ISO format
 * @returns List of calendar events or null if not found
 */
export async function getCalendarEvents(
	userId: string,
	startDateTime: string,
	endDateTime: string,
) {
	try {
		const graphClient = await getGraphClientForUser(userId);

		if (!graphClient) {
			return null;
		}

		return await graphClient
			.api("/me/calendarView")
			.query({
				startDateTime,
				endDateTime,
			})
			.select("subject,organizer,start,end,location")
			.orderby("start/dateTime")
			.get();
	} catch (error) {
		console.error("Error getting calendar events:", error);
		return null;
	}
}

/**
 * Get the user's emails
 * @param userId The internal user ID in our system
 * @param limit Maximum number of emails to retrieve
 * @returns List of emails or null if not found
 */
export async function getEmails(userId: string, limit = 10) {
	try {
		const graphClient = await getGraphClientForUser(userId);

		if (!graphClient) {
			return null;
		}

		return await graphClient
			.api("/me/messages")
			.top(limit)
			.select("subject,from,receivedDateTime,isRead")
			.orderby("receivedDateTime DESC")
			.get();
	} catch (error) {
		console.error("Error getting emails:", error);
		return null;
	}
}
