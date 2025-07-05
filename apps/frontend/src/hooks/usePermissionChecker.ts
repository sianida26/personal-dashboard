import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ExtendedPermissionCodeWithAll, PermissionCode } from "@repo/data";
import useAuth from "./useAuth";

interface UsePermissionCheckerOptions {
	/**
	 * Auto-check permissions every X milliseconds
	 * Set to 0 to disable automatic checking
	 * Default: 30000 (30 seconds)
	 */
	autoCheckInterval?: number;

	/**
	 * Redirect to original route when permissions are restored
	 * Default: true
	 */
	redirectOnRestore?: boolean;

	/**
	 * Callback when permissions are restored
	 */
	onPermissionRestored?: () => void;
}

/**
 * Hook to check if user has permissions and handle permission restoration
 * Useful for 403 pages and permission-sensitive components
 */
export const usePermissionChecker = (
	requiredPermissions:
		| ExtendedPermissionCodeWithAll[]
		| ExtendedPermissionCodeWithAll,
	options: UsePermissionCheckerOptions = {},
) => {
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const [isChecking, setIsChecking] = useState(false);
	const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
	const [hasPermission, setHasPermission] = useState(false);

	const {
		autoCheckInterval = 30000,
		redirectOnRestore = true,
		onPermissionRestored,
	} = options;

	const permissionArray = Array.isArray(requiredPermissions)
		? requiredPermissions
		: [requiredPermissions];

	// Check if user has the required permissions
	const checkPermissions = useCallback(() => {
		if (!isAuthenticated || !user) {
			setHasPermission(false);
			return false;
		}

		const hasAccess = permissionArray.some((permission) => {
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

		setHasPermission(hasAccess);
		return hasAccess;
	}, [user, isAuthenticated, permissionArray]);

	// Manual permission check with loading state
	const checkPermissionsManually = useCallback(async () => {
		setIsChecking(true);
		setLastCheckTime(new Date());

		// Small delay to allow for any ongoing permission updates
		await new Promise((resolve) => setTimeout(resolve, 500));

		const hasAccess = checkPermissions();
		setIsChecking(false);

		if (hasAccess) {
			onPermissionRestored?.();

			if (redirectOnRestore) {
				const originalRoute = sessionStorage.getItem("originalRoute");
				if (originalRoute) {
					sessionStorage.removeItem("originalRoute");
					navigate({ to: originalRoute });
				}
			}
		}

		return hasAccess;
	}, [checkPermissions, navigate, onPermissionRestored, redirectOnRestore]);

	// Auto-check permissions at intervals
	useEffect(() => {
		if (!autoCheckInterval || autoCheckInterval <= 0) return;

		const interval = setInterval(() => {
			if (hasPermission) return; // No need to check if already has permission

			checkPermissionsManually();
		}, autoCheckInterval);

		return () => clearInterval(interval);
	}, [autoCheckInterval, hasPermission, checkPermissionsManually]);

	// Check permissions on mount and when auth state changes
	useEffect(() => {
		checkPermissions();
	}, [checkPermissions]);

	return {
		hasPermission,
		isChecking,
		lastCheckTime,
		checkPermissions: checkPermissionsManually,
	};
};

export default usePermissionChecker;
