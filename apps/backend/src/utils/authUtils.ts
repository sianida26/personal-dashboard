import jwt from "jsonwebtoken";

const accessTokenSecret =
	process.env.ACCESS_TOKEN_SECRET ?? "some-random-secret";
const refreshTokenSecret =
	process.env.REFRESH_TOKEN_SECRET ?? "some-very-random-secret";
const algorithm: jwt.Algorithm = "HS256";

export const accessTokenExpiry: number | string | null = null; // null for no expiry
export const refreshTokenExpiry: number | string | null = "30d"; // null for no expiry

interface AccessTokenPayload {
	uid: string;
}

interface RefreshTokenPayload {
	uid: string;
}

export const generateAccessToken = async (payload: AccessTokenPayload) => {
	const token = jwt.sign(payload, accessTokenSecret, {
		algorithm,
		...(accessTokenExpiry ? { expiresIn: accessTokenExpiry } : {}),
	});
	return token;
};

export const generateRefreshToken = async (payload: RefreshTokenPayload) => {
	const token = jwt.sign(payload, refreshTokenSecret, {
		algorithm,
		...(refreshTokenExpiry ? { expiresIn: refreshTokenExpiry } : {}),
	});
	return token;
};

export const verifyAccessToken = async (token: string) => {
	try {
		const payload = jwt.verify(
			token,
			accessTokenSecret
		) as AccessTokenPayload;
		return payload;
	} catch {
		return null;
	}
};

export const verifyRefreshToken = async (token: string) => {
	try {
		const payload = jwt.verify(
			token,
			refreshTokenSecret
		) as RefreshTokenPayload;
		return payload;
	} catch {
		return null;
	}
};
