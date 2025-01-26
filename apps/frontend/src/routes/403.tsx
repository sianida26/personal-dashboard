import illustration from "@/assets/illustrations/undraw_alert_w756.svg";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/403")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center gap-8 px-4 lg:px-8">
			<img
				src={illustration}
				alt="403 Forbidden Illustration"
				className="w-full max-w-(--breakpoint-md)"
			/>
			<div className="flex flex-col items-center text-lg gap-4 text-center">
				<h1 className="text-4xl font-bold">403 - Forbidden</h1>
				<p className="text-muted-foreground text-base">
					Oh no! You've been caught trying to access a page you're not allowed
					to see. Maybe it's a super-secret club, or maybe the internet gods
					just said, "Nah"
				</p>
				<p className="text-muted-foreground text-base">
					Go back, take a deep breath, and try something else, Or grab a snack.
					Snacks fix everyting!
				</p>
				<a href="/" className="font-medium">
					Take me home! 🏠
				</a>
			</div>
		</div>
	);
}
