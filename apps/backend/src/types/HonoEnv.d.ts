import { SpecificPermissionCode } from "../data/permissions";
import { RoleCode } from "../data/roles";

type HonoEnv = {
	Variables: {
		uid?: string;
		currentUser?: {
			name: string;
			permissions: SpecificPermissionCode[];
			roles: RoleCode[];
		};
	};
};

export default HonoEnv;
