import { createFileRoute, Link } from "@tanstack/react-router";
import illustration from "@/assets/illustrations/undraw_alert_w756.svg";

export const Route = createFileRoute("/404")({
	component: NotFoundPage,
});

function NotFoundPage() {
	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center gap-8 px-4 lg:px-8">
			<img
				src={illustration}
				alt="404 Not Found Illustration"
				className="w-full max-w-(--breakpoint-md)"
			/>
			<div className="flex flex-col items-center text-lg gap-4 text-center">
				<h1 className="text-4xl font-bold">404 - Page Not Found</h1>
				<p className="text-muted-foreground text-base">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<p className="text-muted-foreground text-base">
					Please check the URL or navigate back to the home page.
				</p>

				<Link to="/" className="font-medium text-primary hover:underline">
					Take me home! 🏠
				</Link>
			</div>
		</div>
	);
}
