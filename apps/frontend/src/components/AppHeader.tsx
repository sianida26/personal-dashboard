import { SidebarTrigger } from "./ui/sidebar";
import { useMatches } from "@tanstack/react-router";

export default function AppHeader() {
	const matches = useMatches();

	const pageTitle = matches.at(-1)?.staticData.title ?? "";

	return (
		<div className="w-full h-16 border-b flex items-center justify-between px-4 fixed">
			{/* Left Side */}
			<div className="flex gap-4 items-center">
				<SidebarTrigger />

				<div className="font-semibold">{pageTitle}</div>
			</div>

			{/* RIght Side */}
			<div></div>
		</div>
	);
}
