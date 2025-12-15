import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import { TbBell, TbChevronDown, TbDoorExit, TbUser } from "react-icons/tb";
import defaultProfilePicture from "@/assets/images/default-picture.jpg";
import useAuth from "@/hooks/useAuth";

/**
 * ProfileMenu - Always accessible profile dropdown with logout functionality
 * This component is independent of the sidebar and remains functional even when sidebar fails
 */
export default function ProfileMenu() {
	const { user } = useAuth();

	if (!user) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex h-10 items-center gap-2 px-2"
					aria-label="User menu"
				>
					<img
						src={defaultProfilePicture}
						alt="User avatar"
						className="h-8 w-8 rounded-full"
					/>
					<div className="hidden md:flex flex-col items-start text-left">
						<span className="text-sm font-semibold leading-none">
							{user.name}
						</span>
						<span className="text-xs text-muted-foreground">
							{user.email ?? user.username ?? "User"}
						</span>
					</div>
					<TbChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<div className="flex items-center gap-2 p-2">
					<img
						src={defaultProfilePicture}
						alt="User avatar"
						className="h-10 w-10 rounded-full"
					/>
					<div className="flex flex-col">
						<span className="text-sm font-semibold">
							{user.name}
						</span>
						<span className="text-xs text-muted-foreground">
							{user.email ?? user.username ?? "User"}
						</span>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					<TbUser className="mr-2 h-4 w-4" />
					<span>Account</span>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						to="/personal/notifications"
						className="cursor-pointer"
					>
						<TbBell className="mr-2 h-4 w-4" />
						<span>Notifications</span>
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						to="/logout"
						className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
					>
						<TbDoorExit className="mr-2 h-4 w-4" />
						<span>Sign Out</span>
						<span className="ml-auto text-xs text-muted-foreground">
							⌘⇧Q
						</span>
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
