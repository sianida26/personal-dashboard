import { Alert, Button } from "@repo/ui";
import { Component, type ReactNode } from "react";
import { TbAlertCircle, TbHome, TbRefresh } from "react-icons/tb";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Global App Error Boundary
 * Catches unhandled errors throughout the entire app and shows graceful fallback
 * Provides user options to reload or go home
 */
export default class AppErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("App Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			const isNetworkError =
				this.state.error?.message.includes("NetworkError") ||
				this.state.error?.message.includes("Failed to fetch") ||
				this.state.error?.message.includes("Network request failed");

			return (
				<div className="flex h-screen w-screen items-center justify-center bg-background p-4">
					<div className="w-full max-w-md space-y-6">
						<Alert variant="destructive">
							<TbAlertCircle className="h-4 w-4" />
							<div>
								<h3 className="font-semibold">
									{isNetworkError
										? "Can't reach the server"
										: "Something went wrong"}
								</h3>
								<p className="text-sm">
									{isNetworkError
										? "We're having trouble connecting to the server. Please check your internet connection and try again."
										: "An unexpected error occurred. Please try refreshing the page."}
								</p>
							</div>
						</Alert>

						<div className="flex flex-col gap-3">
							<Button
								onClick={() => window.location.reload()}
								className="w-full gap-2"
								size="lg"
							>
								<TbRefresh className="h-4 w-4" />
								Refresh Page
							</Button>

							<Button
								variant="outline"
								onClick={() => {
									window.location.href = "/";
								}}
								className="w-full gap-2"
								size="lg"
							>
								<TbHome className="h-4 w-4" />
								Go Home
							</Button>
						</div>

						{process.env.NODE_ENV === "development" && (
							<div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
								<p className="text-xs font-mono text-destructive">
									{this.state.error?.message}
								</p>
								{this.state.error?.stack && (
									<p className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-32">
										{this.state.error.stack}
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
