/**
 * Generates RSA key pair and outputs them as base64-encoded strings
 * for use as environment variables in production deployments.
 *
 * Usage: bun run generate-jwt-keys
 *
 * Output:
 * - JWT_PRIVATE_KEY: base64-encoded private key
 * - JWT_PUBLIC_KEY: base64-encoded public key
 *
 * Copy these values to your deployment environment configuration.
 */

import * as crypto from "node:crypto";

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

const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

console.log("=".repeat(80));
console.log("JWT Key Pair Generated Successfully");
console.log("=".repeat(80));
console.log("\nAdd these to your production environment variables:\n");
console.log("JWT_PRIVATE_KEY=" + privateKeyBase64);
console.log("\nJWT_PUBLIC_KEY=" + publicKeyBase64);
console.log("\n" + "=".repeat(80));
console.log("IMPORTANT: Store these securely! The private key must never be exposed.");
console.log("=".repeat(80));
