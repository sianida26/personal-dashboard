import { SpecificPermissionCode } from "../data/permissions";
import { RoleCode } from "../data/defaultRoles";

type HonoEnv = {
	Variables: {
		uid?: string;
		currentUser?: {
			name: string;
			permissions: SpecificPermissionCode[];
			roles: RoleCode[];
		};
		requestId: string;
	};
};

export default HonoEnv;
