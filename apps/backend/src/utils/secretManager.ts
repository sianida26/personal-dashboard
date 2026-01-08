import * as crypto from "node:crypto";
import * as fs from "node:fs";
import appEnv from "../appEnv";
import appLogger from "./logger";

// Cache decoded keys in memory to avoid repeated base64 decoding
let cachedPrivateKey: string | null = null;
let cachedPublicKey: string | null = null;

/**
 * Generates an RSA key pair using the specified options.
 *
 * @returns An object containing the generated `privateKey` and `publicKey` in PEM format.
 */
export const generateKeyPair = () => {
	const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "pkcs1",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs1",
			format: "pem",
		},
	});

	return { privateKey, publicKey };
};

/**
 * Creates RSA key pair files for the private and public keys.
 * If the key pair is successfully generated, it writes them to the specified file paths.
 *
 * @returns An object containing the `privateKey` and `publicKey`.
 */
const createKeyPairFiles = () => {
	appLogger.info("Creating public/private key pair...");

	const { privateKey, publicKey } = generateKeyPair();

	fs.writeFileSync(appEnv.PRIVATE_KEY_PATH, privateKey, {
		encoding: "utf-8",
	});
	fs.writeFileSync(appEnv.PUBLIC_KEY_PATH, publicKey, { encoding: "utf-8" });

	appLogger.info("public/private key generated.");

	return { privateKey, publicKey };
};

/**
 * Decodes a base64-encoded key to PEM format.
 *
 * @param base64Key - The base64-encoded key string.
 * @returns The decoded PEM key string.
 */
const decodeBase64Key = (base64Key: string): string => {
	return Buffer.from(base64Key, "base64").toString("utf-8");
};

/**
 * Retrieves the private key with the following priority:
 * 1. Environment variable JWT_PRIVATE_KEY (base64-encoded) - preferred for deployments
 * 2. File-based key from PRIVATE_KEY_PATH
 * 3. Auto-generate new key pair (development only)
 *
 * @returns The `privateKey` as a string in PEM format.
 */
export const getPrivateKey = () => {
	// Return cached key if available
	if (cachedPrivateKey) {
		return cachedPrivateKey;
	}

	// Priority 1: Environment variable (base64-encoded)
	if (appEnv.JWT_PRIVATE_KEY) {
		cachedPrivateKey = decodeBase64Key(appEnv.JWT_PRIVATE_KEY);
		appLogger.info("Using JWT_PRIVATE_KEY from environment variable");
		return cachedPrivateKey;
	}

	// Priority 2: File-based key
	if (fs.existsSync(appEnv.PRIVATE_KEY_PATH)) {
		cachedPrivateKey = fs.readFileSync(appEnv.PRIVATE_KEY_PATH, "utf-8");
		return cachedPrivateKey;
	}

	// Priority 3: Generate new keys (development only - NOT recommended for production)
	if (appEnv.APP_ENV === "production") {
		const error = new Error(
			"JWT keys must be configured via environment variables in production. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.",
		);
		appLogger.error(error);
		throw error;
	}

	appLogger.info("public/private key pair does not exist - generating for development");
	const { privateKey } = createKeyPairFiles();
	cachedPrivateKey = privateKey;
	return cachedPrivateKey;
};

/**
 * Retrieves the public key with the following priority:
 * 1. Environment variable JWT_PUBLIC_KEY (base64-encoded) - preferred for deployments
 * 2. File-based key from PUBLIC_KEY_PATH
 * 3. Auto-generate new key pair (development only)
 *
 * @returns The `publicKey` as a string in PEM format.
 */
export const getPublicKey = () => {
	// Return cached key if available
	if (cachedPublicKey) {
		return cachedPublicKey;
	}

	// Priority 1: Environment variable (base64-encoded)
	if (appEnv.JWT_PUBLIC_KEY) {
		cachedPublicKey = decodeBase64Key(appEnv.JWT_PUBLIC_KEY);
		appLogger.info("Using JWT_PUBLIC_KEY from environment variable");
		return cachedPublicKey;
	}

	// Priority 2: File-based key
	if (fs.existsSync(appEnv.PUBLIC_KEY_PATH)) {
		cachedPublicKey = fs.readFileSync(appEnv.PUBLIC_KEY_PATH, "utf-8");
		return cachedPublicKey;
	}

	// Priority 3: Generate new keys (development only - NOT recommended for production)
	if (appEnv.APP_ENV === "production") {
		const error = new Error(
			"JWT keys must be configured via environment variables in production. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.",
		);
		appLogger.error(error);
		throw error;
	}

	appLogger.info("public/private key pair does not exist - generating for development");
	const { publicKey } = createKeyPairFiles();
	cachedPublicKey = publicKey;
	return cachedPublicKey;
};
