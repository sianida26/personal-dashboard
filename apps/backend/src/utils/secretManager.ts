import appEnv from "../appEnv";
import appLogger from "./logger";
import * as fs from "fs";
import * as crypto from "crypto";

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

export const getPrivateKey = () => {
	if (fs.existsSync(appEnv.PRIVATE_KEY_PATH)) {
		return fs.readFileSync(appEnv.PRIVATE_KEY_PATH, "utf-8");
	} else {
		appLogger.info("public/private key pair does not exists");
		const { privateKey } = createKeyPairFiles();
		return privateKey;
	}
};

export const getPublicKey = () => {
	if (fs.existsSync(appEnv.PUBLIC_KEY_PATH)) {
		return fs.readFileSync(appEnv.PUBLIC_KEY_PATH, "utf-8");
	} else {
		appLogger.info("public/private key pair does not exists");
		const { publicKey } = createKeyPairFiles();
		return publicKey;
	}
};
