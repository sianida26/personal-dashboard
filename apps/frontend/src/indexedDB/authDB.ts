import Dexie from "dexie";

/**
 * Interface representing the authentication data stored in the IndexedDB.
 */
export interface AuthData {
	/**
	 * The unique key for the authentication record.
	 */
	key: string;

	/**
	 * The ID of the user.
	 */
	userId: string | null;

	/**
	 * The name of the user.
	 */
	userName: string | null;

	/**
	 * The permissions granted to the user.
	 */
	permissions: string[] | null;

	/**
	 * The roles assigned to the user.
	 */
	roles: string[] | null;

	/**
	 * The access token for authentication.
	 */
	accessToken: string | null;
}

/**
 * Class representing the authentication database using Dexie.js.
 * This class extends Dexie and sets up an IndexedDB store for authentication data.
 */
class AuthDB extends Dexie {
	/**
	 * The Dexie table for AuthData. The primary key is defined as a string.
	 */
	auth!: Dexie.Table<AuthData, string>;

	/**
	 * Creates an instance of AuthDB, initializing the database and its versioned stores.
	 */
	constructor() {
		super("AuthDatabase");
		this.version(1).stores({
			auth: "key",
		});
	}
}

/**
 * An instance of the AuthDB used throughout the application.
 */
export const authDB = new AuthDB();
