import { cn } from "@repo/ui/utils";
import type { ColorScheme, ThemeMode } from "@repo/validation";
import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
	TbCheck,
	TbChevronRight,
	TbDeviceDesktop,
	TbMoon,
	TbPalette,
	TbSun,
} from "react-icons/tb";
import { useTheme } from "@/contexts/Theme/ThemeProvider";

const themeModes: { value: ThemeMode; label: string; icon: React.ReactNode }[] =
	[
		{ value: "light", label: "Light", icon: <TbSun size={16} /> },
		{ value: "dark", label: "Dark", icon: <TbMoon size={16} /> },
		{
			value: "system",
			label: "System",
			icon: <TbDeviceDesktop size={16} />,
		},
	];

const colorSchemes: {
	value: ColorScheme;
	label: string;
	preview: string;
	bgClass: string;
}[] = [
	{
		value: "default",
		label: "Default",
		preview: "hsl(0 0% 9%)",
		bgClass: "bg-gray-900",
	},
	{
		value: "blue",
		label: "Blue",
		preview: "hsl(221.2 83.2% 53.3%)",
		bgClass: "bg-blue-600",
	},
	{
		value: "purple",
		label: "Purple",
		preview: "hsl(262.1 83.3% 57.8%)",
		bgClass: "bg-purple-600",
	},
	{
		value: "green",
		label: "Green",
		preview: "hsl(142.1 76.2% 36.3%)",
		bgClass: "bg-green-600",
	},
	{
		value: "orange",
		label: "Orange",
		preview: "hsl(24.6 95% 53.1%)",
		bgClass: "bg-orange-600",
	},
	{
		value: "red",
		label: "Red",
		preview: "hsl(0 72.2% 50.6%)",
		bgClass: "bg-red-600",
	},
	{
		value: "pink",
		label: "Pink",
		preview: "hsl(322.4 84.1% 60.2%)",
		bgClass: "bg-pink-600",
	},
	{
		value: "teal",
		label: "Teal",
		preview: "hsl(178.6 84.2% 35.1%)",
		bgClass: "bg-teal-600",
	},
	{
		value: "yellow",
		label: "Yellow",
		preview: "hsl(45.4 93.4% 47.5%)",
		bgClass: "bg-yellow-500",
	},
	{
		value: "cyan",
		label: "Cyan",
		preview: "hsl(188.7 94.5% 42.7%)",
		bgClass: "bg-cyan-500",
	},
	{
		value: "indigo",
		label: "Indigo",
		preview: "hsl(243.4 75.4% 58.6%)",
		bgClass: "bg-indigo-600",
	},
	{
		value: "rose",
		label: "Rose",
		preview: "hsl(346.8 77.2% 49.8%)",
		bgClass: "bg-rose-600",
	},
];

export function ThemeSettings({ children }: { children?: React.ReactNode }) {
	const { themeMode, colorScheme, setThemeMode, setColorScheme, isSyncing } =
		useTheme();
	const { setTheme } = useNextTheme();
	const [isOpen, setIsOpen] = useState(false);

	// Sync with next-themes when themeMode changes
	useEffect(() => {
		setTheme(themeMode);
	}, [themeMode, setTheme]);

	const handleThemeModeChange = (mode: ThemeMode) => {
		setThemeMode(mode);
	};

	const handleColorSchemeChange = (scheme: ColorScheme) => {
		setColorScheme(scheme);
	};

	if (children) {
		// When used as dropdown item, render as expandable sub-menu
		return (
			<div className="relative">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className={cn(
						"flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm",
						"hover:bg-accent hover:text-accent-foreground",
						"focus:bg-accent focus:text-accent-foreground",
						"transition-colors",
						isOpen && "bg-accent",
					)}
				>
					<div className="flex items-center gap-2">{children}</div>
					<div className="flex items-center gap-1">
						{isSyncing && (
							<div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
						)}
						<TbChevronRight
							size={14}
							className={cn(
								"transition-transform",
								isOpen && "rotate-90",
							)}
						/>
					</div>
				</button>

				{isOpen && (
					<div className="ml-4 mt-1 space-y-3 py-2">
						{/* Theme Mode Section */}
						<div>
							<h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
								Theme Mode
							</h5>
							<div className="grid grid-cols-3 gap-1">
								{themeModes.map((mode) => (
									<button
										key={mode.value}
										type="button"
										onClick={() =>
											handleThemeModeChange(mode.value)
										}
										className={cn(
											"flex flex-col items-center gap-1 rounded p-2 text-xs",
											"hover:bg-accent/50 transition-colors",
											themeMode === mode.value
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground",
										)}
									>
										{mode.icon}
										<span>{mode.label}</span>
									</button>
								))}
							</div>
						</div>

						{/* Color Scheme Section */}
						<div>
							<h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
								Color Scheme
							</h5>
							<div className="grid grid-cols-4 gap-1">
								{colorSchemes.map((scheme) => (
									<button
										key={scheme.value}
										type="button"
										onClick={() =>
											handleColorSchemeChange(
												scheme.value,
											)
										}
										className={cn(
											"relative flex flex-col items-center gap-1 rounded p-2 text-xs",
											"hover:bg-accent/50 transition-colors",
											colorScheme === scheme.value
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground",
										)}
									>
										<div
											className="h-3 w-3 rounded-full border border-border"
											style={{
												backgroundColor: scheme.preview,
											}}
										/>
										<span>{scheme.label}</span>
										{colorScheme === scheme.value && (
											<TbCheck
												size={12}
												className="absolute top-1 right-1 text-accent-foreground"
											/>
										)}
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	// Original popover implementation for standalone usage
	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
					"text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
					"transition-colors",
					isOpen && "bg-sidebar-accent",
				)}
				title="Theme Settings"
			>
				<TbPalette size={14} />
				<span className="flex-1 text-left text-dark">Theme</span>
				{isSyncing && (
					<div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
				)}
			</button>

			{isOpen && (
				<>
					{/* Backdrop */}
					{/** biome-ignore lint/a11y/noStaticElementInteractions: <> */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
						onKeyDown={(e) => {
							if (e.key === "Escape") setIsOpen(false);
						}}
					/>

					{/* Popover */}
					<div className="absolute left-0 bottom-full mb-2 z-50 w-72 rounded-lg border bg-popover p-4 shadow-lg">
						<div className="space-y-4">
							{/* Theme Mode Section */}
							<div>
								<h4 className="text-sm font-medium mb-2 text-foreground">
									Theme Mode
								</h4>
								<div className="grid grid-cols-3 gap-2">
									{themeModes.map((mode) => (
										<button
											key={mode.value}
											type="button"
											onClick={() =>
												handleThemeModeChange(
													mode.value,
												)
											}
											className={cn(
												"flex flex-col items-center gap-1.5 rounded-md border-2 p-2.5",
												"transition-colors hover:bg-accent",
												themeMode === mode.value
													? "border-primary bg-accent"
													: "border-border",
											)}
										>
											<div className="text-foreground">
												{mode.icon}
											</div>
											<span className="text-xs font-medium text-foreground">
												{mode.label}
											</span>
											{themeMode === mode.value && (
												<TbCheck
													size={14}
													className="text-primary absolute top-1 right-1"
												/>
											)}
										</button>
									))}
								</div>
							</div>

							{/* Color Scheme Section */}
							<div>
								<h4 className="text-sm font-medium mb-2 text-foreground">
									Color Scheme
								</h4>
								<div className="grid grid-cols-4 gap-2">
									{colorSchemes.map((scheme) => (
										<button
											key={scheme.value}
											type="button"
											onClick={() =>
												handleColorSchemeChange(
													scheme.value,
												)
											}
											className={cn(
												"relative flex flex-col items-center gap-1.5 rounded-md border-2 p-2.5",
												"transition-colors hover:bg-accent",
												colorScheme === scheme.value
													? "border-primary bg-accent"
													: "border-border",
											)}
										>
											<div
												className={cn(
													"h-5 w-5 rounded-full",
													scheme.bgClass,
												)}
												style={{
													backgroundColor:
														scheme.preview,
												}}
											/>
											<span className="text-xs font-medium text-foreground">
												{scheme.label}
											</span>
											{colorScheme === scheme.value && (
												<TbCheck
													size={14}
													className="text-primary absolute top-1 right-1"
												/>
											)}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
