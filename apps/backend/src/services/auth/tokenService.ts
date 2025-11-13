import { createId } from "@paralleldrive/cuid2";
import { eq, lt } from "drizzle-orm";
import DashboardError from "../../errors/DashboardError";
import db from "../../drizzle";
import { refreshTokens } from "../../drizzle/schema/refreshTokens";
import {
	generateRefreshToken,
	verifyRefreshToken,
	type RefreshTokenPayload,
} from "../../utils/authUtils";

export const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

export type RefreshTokenRecord = typeof refreshTokens.$inferSelect;

const unauthorizedError = new DashboardError({
	message: "Refresh token is invalid or expired",
	errorCode: "INVALID_REFRESH_TOKEN",
	severity: "LOW",
	statusCode: 401,
});

const ensureRefreshTokenNotExpired = (record: RefreshTokenRecord) => {
	if (record.expiresAt < new Date()) {
		throw unauthorizedError;
	}
};

export const createPersistedRefreshToken = async (userId: string) => {
	const tokenId = createId();
	const refreshToken = await generateRefreshToken({
		uid: userId,
		tokenId,
	});
	const hashedToken = await Bun.password.hash(refreshToken);
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

	await db.insert(refreshTokens).values({
		id: tokenId,
		userId,
		tokenHash: hashedToken,
		expiresAt,
	});

	return {
		refreshToken,
		tokenId,
		expiresAt,
	};
};

export const markRefreshTokenAsRevoked = async (tokenId: string) => {
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokens.id, tokenId));
};

export const purgeExpiredRefreshTokens = async () => {
	await db
		.delete(refreshTokens)
		.where(lt(refreshTokens.expiresAt, new Date()));
};

export const validateRefreshTokenOrThrow = async (token: string) => {
	const payload = await verifyRefreshToken(token);

	if (!payload) {
		throw unauthorizedError;
	}

	return validateRefreshTokenByPayload(payload, token);
};

export const validateRefreshTokenByPayload = async (
	payload: RefreshTokenPayload,
	token: string,
) => {
	const record = await db.query.refreshTokens.findFirst({
		where: eq(refreshTokens.id, payload.tokenId),
	});

	if (!record || record.userId !== payload.uid || record.revokedAt) {
		throw unauthorizedError;
	}

	ensureRefreshTokenNotExpired(record);

	const isValid = await Bun.password.verify(token, record.tokenHash);

	if (!isValid) {
		throw unauthorizedError;
	}

	return record;
};
