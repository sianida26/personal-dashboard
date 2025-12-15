import { Alert, Button } from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import { TbAlertCircle, TbDoorExit } from "react-icons/tb";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary for Sidebar
 * When sidebar fails to load, shows a fallback UI with emergency logout button
 * This ensures users can always logout even if sidebar crashes
 */
export default class SidebarErrorBoundary extends Component<Props, State> {
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
		console.error("Sidebar Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex h-full flex-col items-center justify-center gap-4 border-r bg-background p-4">
					<Alert variant="destructive" className="w-full max-w-sm">
						<TbAlertCircle className="h-4 w-4" />
						<div>
							<h3 className="font-semibold">Sidebar Error</h3>
							<p className="text-sm">
								Sidebar gagal dimuat. Silakan logout dan login
								kembali.
							</p>
						</div>
					</Alert>

					<Link to="/logout" className="w-full max-w-sm">
						<Button
							variant="destructive"
							className="w-full"
							size="lg"
						>
							<TbDoorExit className="mr-2 h-5 w-5" />
							Emergency Logout
						</Button>
					</Link>

					<div className="mt-4 text-center">
						<p className="text-xs text-muted-foreground">
							Error: {this.state.error?.message}
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-2 text-xs text-primary underline hover:no-underline"
						>
							Reload Page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
