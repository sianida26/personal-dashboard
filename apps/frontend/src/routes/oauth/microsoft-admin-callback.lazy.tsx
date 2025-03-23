import { createLazyFileRoute } from "@tanstack/react-router";
import MicrosoftAdminCallback from "../../pages/auth/MicrosoftAdminCallback";

export const Route = createLazyFileRoute("/oauth/microsoft-admin-callback")({
	component: MicrosoftAdminCallback,
}); 