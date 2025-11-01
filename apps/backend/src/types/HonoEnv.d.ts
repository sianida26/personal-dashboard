import type { RoleCode } from "../data/defaultRoles";
import type { SpecificPermissionCode } from "../data/permissions";

type HonoEnv = {
	Variables: {
		uid?: string;
		currentUser?: {
			name: string;
			email: string | null;
			permissions: SpecificPermissionCode[];
			roles: RoleCode[];
		};
		requestId: string;
	};
};

export default HonoEnv;
