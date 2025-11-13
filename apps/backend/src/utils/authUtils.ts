import jwt, { type SignOptions } from "jsonwebtoken";
import DashboardError from "../errors/DashboardError";
import { getPrivateKey, getPublicKey } from "./secretManager";

// Environment variables for secrets, defaulting to a random secret if not set.
// const accessTokenSecret = appEnv.ACCESS_TOKEN_SECRET;
// const refreshTokenSecret = appEnv.REFRESH_TOKEN_SECRET;

// Algorithm to be used for JWT encoding.
const algorithm: jwt.Algorithm = "RS256";

export const accessTokenExpiry: jwt.SignOptions["expiresIn"] | null = "5m";
export const refreshTokenExpiry: jwt.SignOptions["expiresIn"] | null = "60d";

// Interfaces to describe the payload structure for access and refresh tokens.
export interface AccessTokenPayload {
	uid: string;
	permissions?: string[];
	roles?: string[];
}

export interface RefreshTokenPayload {
	uid: string;
	tokenId: string;
}

/**
 * Generates a JSON Web Token (JWT) for access control using a specified payload.
 *
 * @param payload - The payload containing user-specific data for the token.
 * @returns A promise that resolves to the generated JWT string.
 */
export const generateAccessToken = async (payload: AccessTokenPayload) => {
	const options: SignOptions = {
		algorithm,
		...(accessTokenExpiry ? { expiresIn: accessTokenExpiry } : {}),
	};
	const token = jwt.sign(payload, getPrivateKey(), options);
	return token;
};

/**
 * Generates a JSON Web Token (JWT) for refresh purposes using a specified payload.
 *
 * @param payload - The payload containing user-specific data for the token.
 * @returns A promise that resolves to the generated JWT string.
 */
export const generateRefreshToken = async (payload: RefreshTokenPayload) => {
	const token = jwt.sign(payload, getPrivateKey(), {
		algorithm,
		...(refreshTokenExpiry ? { expiresIn: refreshTokenExpiry } : {}),
	});
	return token;
};

/**
 * Verifies a given access token and decodes the payload if the token is valid.
 *
 * @param token - The JWT string to verify.
 * @returns A promise that resolves to the decoded payload or null if verification fails.
 */
export const verifyAccessToken = async (token: string) => {
	try {
		const payload = jwt.verify(token, getPublicKey()) as AccessTokenPayload;
		return payload;
	} catch (e) {
		if (e instanceof jwt.JsonWebTokenError) {
			if (e.message === "invalid signature") {
				throw new DashboardError({
					message: "Invalid access token signature",
					errorCode: "invalid_signature",
					severity: "LOW",
					statusCode: 401,
				});
			}
		}
		return null;
	}
};

/**
 * Verifies a given refresh token and decodes the payload if the token is valid.
 *
 * @param token - The JWT string to verify.
 * @returns A promise that resolves to the decoded payload or null if verification fails.
 */
export const verifyRefreshToken = async (token: string) => {
	try {
		const payload = jwt.verify(
			token,
			getPublicKey(),
		) as RefreshTokenPayload;
		return payload;
	} catch {
		return null;
	}
};
