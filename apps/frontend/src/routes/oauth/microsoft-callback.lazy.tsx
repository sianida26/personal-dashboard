import { createLazyFileRoute } from "@tanstack/react-router";
import MicrosoftCallback from "../../pages/auth/MicrosoftCallback";

/**
 * Microsoft callback route for handling authentication callback from Microsoft OAuth
 */
export const Route = createLazyFileRoute("/oauth/microsoft-callback")({
	component: MicrosoftCallbackPage,
});

function MicrosoftCallbackPage() {
	return <MicrosoftCallback />;
}
