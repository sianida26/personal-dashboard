import AuthContext from "@/contexts/Auth/AuthContext";
import type { ExtendedPermissionCodeWithAll, PermissionCode } from "@repo/data";
import { useNavigate } from "@tanstack/react-router";
import { useContext } from "react";

/**
 * A hook that provides access to authentication context.
 * This hook must be used within an AuthProvider component.
 *
 * @returns The authentication context containing auth-related state and functions
 * @throws {Error} If used outside of an AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const auth = useAuth();
 *   // Use auth context here
 * }
 * ```
 */
const useAuth = () => {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
};

/**
 * A hook to check if the current user has the required permissions. It can be used to protect routes or components.
 *
 * @param permissions - Single permission or array of permissions to check against
 * Can be:
 * - "*": Allows all access
 * - "authenticated-only": Requires user to be logged in
 * - "guest-only": Requires user to be not logged in
 * - PermissionCode: Specific permission code that user must have
 *
 * @returns true if user has required permissions, false otherwise
 * If user doesn't have permission, automatically redirects to 403 page
 *
 * @example
 * ```typescript
 * // Single permission check
 * const hasAccess = usePermissions("user.create");
 *
 * // Multiple permissions check (OR condition)
 * const hasAccess = usePermissions(["user.create", "user.update"]);
 * ```
 */
export const usePermissions = (
	permissions:
		| ExtendedPermissionCodeWithAll[]
		| ExtendedPermissionCodeWithAll,
) => {
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	//the user is authenticated but the user object is not yet loaded
	if (isAuthenticated && !user) {
		return false;
	}

	const permissionArray = Array.isArray(permissions)
		? permissions
		: [permissions];

	const hasPermission = permissionArray.some((permission) => {
		if (permission === "*") {
			return true;
		}

		if (permission === "authenticated-only") {
			return !!user;
		}

		if (permission === "guest-only") {
			return !user;
		}

		if (typeof permission === "string") {
			return user?.permissions.includes(permission as PermissionCode);
		}

		return false;
	});

	if (!hasPermission) {
		// Store the current location for potential redirect back after permissions are restored
		const currentLocation =
			window.location.pathname + window.location.search;
		sessionStorage.setItem("originalRoute", currentLocation);

		// Store the required permissions so the 403 page can check against them
		sessionStorage.setItem(
			"originalPermissions",
			JSON.stringify(permissionArray),
		);

		navigate({
			to: "/403",
		});
	}

	return true;
};

export default useAuth;
