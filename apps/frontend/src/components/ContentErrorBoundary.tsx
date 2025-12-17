import { Alert, Button } from "@repo/ui";
import { Component, type ReactNode } from "react";
import { TbAlertCircle, TbRefresh } from "react-icons/tb";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary for main content area
 * Shows a friendly message instead of crashing the entire page
 */
export default class ContentErrorBoundary extends Component<Props, State> {
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
		console.error("Content Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			const isNetworkError =
				this.state.error?.message.includes("NetworkError") ||
				this.state.error?.message.includes("Failed to fetch") ||
				this.state.error?.message.includes("Network request failed");

			return (
				<div className="flex h-full w-full items-center justify-center p-8">
					<div className="w-full max-w-md">
						<Alert
							variant={isNetworkError ? "default" : "destructive"}
						>
							<TbAlertCircle className="h-4 w-4" />
							<div>
								<h3 className="font-semibold">
									{isNetworkError
										? "Connection issue"
										: "Something went wrong"}
								</h3>
								<p className="text-sm mt-1">
									{isNetworkError
										? "Can't reach the server right now. Please check your connection and try again."
										: "An unexpected error occurred while loading this page."}
								</p>
							</div>
						</Alert>

						<div className="mt-4 flex flex-col gap-2">
							<Button
								onClick={() => {
									this.setState({
										hasError: false,
										error: null,
									});
								}}
								className="w-full"
							>
								<TbRefresh className="mr-2 h-4 w-4" />
								Try Again
							</Button>

							{process.env.NODE_ENV === "development" &&
								this.state.error && (
									<div className="mt-4 rounded border border-destructive/30 bg-destructive/5 p-3">
										<p className="text-xs font-mono text-destructive break-all">
											{this.state.error.message}
										</p>
									</div>
								)}
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
