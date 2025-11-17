import type { PermissionCode } from "@repo/data";
import { generateAccessToken } from "../../utils/authUtils";
import {
	ACCESS_TOKEN_TTL_SECONDS,
	REFRESH_TOKEN_TTL_SECONDS,
	createPersistedRefreshToken,
} from "./tokenService";
import type { users } from "../../drizzle/schema/users";

export type UserWithAuthorization = typeof users.$inferSelect & {
	permissionsToUsers: {
		permission: {
			code: string;
		};
	}[];
	rolesToUsers: {
		role: {
			name: string;
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
		roles.add(userRole.role.name);
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
