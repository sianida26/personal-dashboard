import { Button } from "@/components/ui/button";
import { notifications } from "@/contexts/Notification/NotificationProvider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboardLayout/dev/")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	return (
		<div className="p-4 w-72">
			<Button
				onClick={() => {
					console.log("Showing notification");
					notifications.show({
						message: "This is a notification",
					});
				}}
			>
				Show Notification
			</Button>
		</div>
	);
}
