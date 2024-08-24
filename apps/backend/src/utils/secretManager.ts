import appEnv from "../appEnv";
import appLogger from "./logger";
import * as fs from "fs";
import * as crypto from "crypto";

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
 * Retrieves the private key from the specified file path.
 * If the private key does not exist, it generates a new key pair and returns the private key.
 *
 * @returns The `privateKey` as a string in PEM format.
 */
export const getPrivateKey = () => {
	if (fs.existsSync(appEnv.PRIVATE_KEY_PATH)) {
		return fs.readFileSync(appEnv.PRIVATE_KEY_PATH, "utf-8");
	} else {
		appLogger.info("public/private key pair does not exists");
		const { privateKey } = createKeyPairFiles();
		return privateKey;
	}
};

/**
 * Retrieves the public key from the specified file path.
 * If the public key does not exist, it generates a new key pair and returns the public key.
 *
 * @returns The `publicKey` as a string in PEM format.
 */
export const getPublicKey = () => {
	if (fs.existsSync(appEnv.PUBLIC_KEY_PATH)) {
		return fs.readFileSync(appEnv.PUBLIC_KEY_PATH, "utf-8");
	} else {
		appLogger.info("public/private key pair does not exists");
		const { publicKey } = createKeyPairFiles();
		return publicKey;
	}
};
