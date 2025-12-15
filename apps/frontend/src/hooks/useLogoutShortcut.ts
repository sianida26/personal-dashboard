import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Global keyboard shortcut hook for emergency logout
 * Registers Ctrl/Cmd+Shift+Q to trigger logout
 */
export function useLogoutShortcut() {
	const navigate = useNavigate();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Check for Ctrl/Cmd + Shift + Q
			const isCtrlOrCmd = event.ctrlKey || event.metaKey;
			const isShift = event.shiftKey;
			const isQ = event.key === "Q" || event.key === "q";

			if (isCtrlOrCmd && isShift && isQ) {
				event.preventDefault();
				navigate({ to: "/logout" });
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [navigate]);
}
