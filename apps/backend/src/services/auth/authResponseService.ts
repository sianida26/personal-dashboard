import type { PermissionCode } from "@repo/data";
import type { users } from "../../drizzle/schema/users";
import { generateAccessToken } from "../../utils/authUtils";
import {
	ACCESS_TOKEN_TTL_SECONDS,
	createPersistedRefreshToken,
	REFRESH_TOKEN_TTL_SECONDS,
} from "./tokenService";

export type UserWithAuthorization = typeof users.$inferSelect & {
	permissionsToUsers: {
		permission: {
			code: string;
		};
	}[];
	rolesToUsers: {
		role: {
			code: string;
			permissionsToRoles: {
				permission: {
					code: string;
				};
			}[];
		};
	}[];
};

export const extractUserAuthorization = (user: UserWithAuthorization) => {
	const permissions = new Set<PermissionCode>();
	const roles = new Set<string>();

	for (const userPermission of user.permissionsToUsers) {
		permissions.add(userPermission.permission.code as PermissionCode);
	}

	for (const userRole of user.rolesToUsers) {
		roles.add(userRole.role.code);
		for (const rolePermission of userRole.role.permissionsToRoles) {
			permissions.add(rolePermission.permission.code as PermissionCode);
		}
	}

	return {
		permissions: Array.from(permissions),
		roles: Array.from(roles),
	};
};

export const buildAuthPayload = async (user: UserWithAuthorization) => {
	const { permissions, roles } = extractUserAuthorization(user);

	const accessToken = await generateAccessToken({
		uid: user.id,
		permissions,
		roles,
	});

	const { refreshToken } = await createPersistedRefreshToken(user.id);

	return {
		accessToken,
		refreshToken,
		accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
		refreshTokenExpiresIn: REFRESH_TOKEN_TTL_SECONDS,
		user: {
			id: user.id,
			name: user.name,
			permissions,
			roles,
		},
	};
};

/**
 * Build auth payload reusing an existing refresh token.
 * Used for token refresh to support multiple tabs/devices.
 */
export const buildAuthPayloadWithExistingRefreshToken = async (
	user: UserWithAuthorization,
	existingRefreshToken: string,
	refreshTokenExpiresAt: Date,
) => {
	const { permissions, roles } = extractUserAuthorization(user);

	const accessToken = await generateAccessToken({
		uid: user.id,
		permissions,
		roles,
	});

	// Calculate remaining TTL for the existing refresh token
	const remainingTtlSeconds = Math.max(
		0,
		Math.floor((refreshTokenExpiresAt.getTime() - Date.now()) / 1000),
	);

	return {
		accessToken,
		refreshToken: existingRefreshToken,
		accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
		refreshTokenExpiresIn: remainingTtlSeconds,
		user: {
			id: user.id,
			name: user.name,
			permissions,
			roles,
		},
	};
};
