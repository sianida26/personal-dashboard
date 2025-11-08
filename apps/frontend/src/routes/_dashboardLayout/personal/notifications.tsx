import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	LoadingSpinner,
	Separator,
	Switch,
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TbDeviceFloppy, TbInfoCircle } from "react-icons/tb";
import { toast } from "sonner";
import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";

export const Route = createFileRoute(
	"/_dashboardLayout/personal/notifications",
)({
	component: NotificationPreferencesPage,
});

interface NotificationPreference {
	id?: string;
	category: string;
	channel: string;
	enabled: boolean;
	effective: boolean;
	source?: string;
}

interface NotificationPreferenceSummary {
	userId: string;
	preferences: NotificationPreference[];
}

const CATEGORY_LABELS: Record<string, string> = {
	global: "Global",
	general: "General",
	system: "System",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
	general: "General notifications and updates",
	system: "System announcements and alerts",
};

const CHANNEL_LABELS: Record<string, string> = {
	inApp: "In-App",
	email: "Email",
	whatsapp: "WhatsApp",
};

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
	inApp: "Receive notifications within the application and browser push notifications",
	email: "Receive notifications via email",
	whatsapp: "Receive notifications via WhatsApp",
};

export function NotificationPreferencesPage() {
	const queryClient = useQueryClient();
	const [localPreferences, setLocalPreferences] = useState<
		Record<string, Record<string, boolean>>
	>({});
	const [hasChanges, setHasChanges] = useState(false);

	// Fetch user notification preferences
	const { data, isLoading, error } = useQuery<NotificationPreferenceSummary>({
		queryKey: ["notification-preferences"],
		queryFn: async () => {
			const response = await fetchRPC(
				client["notification-preferences"].$get(),
			);
			return response;
		},
		retry: false,
	});

	// Initialize local preferences when data is loaded
	useEffect(() => {
		if (data?.preferences) {
			const prefs: Record<string, Record<string, boolean>> = {};
			data.preferences.forEach((pref) => {
				if (!prefs[pref.category]) {
					prefs[pref.category] = {};
				}
				prefs[pref.category][pref.channel] = pref.enabled;
			});
			setLocalPreferences(prefs);
			setHasChanges(false);
		}
	}, [data]);

	// Update preferences mutation
	const updateMutation = useMutation({
		mutationFn: async (preferences: NotificationPreference[]) => {
			const response = await fetchRPC(
				client["notification-preferences"].$put({
					json: { preferences },
				}),
			);
			return response;
		},
		onSuccess: () => {
			toast.success("Preferences Updated", {
				description:
					"Your notification preferences have been saved successfully.",
			});
			queryClient.invalidateQueries({
				queryKey: ["notification-preferences"],
			});
			setHasChanges(false);
		},
		onError: (err) => {
			toast.error("Error", {
				description:
					"Failed to update notification preferences. Please try again.",
			});
			console.error("Failed to update preferences:", err);
		},
	});

	const handleToggle = (
		category: string,
		channel: string,
		enabled: boolean,
	) => {
		setLocalPreferences((prev) => ({
			...prev,
			[category]: {
				...prev[category],
				[channel]: enabled,
			},
		}));
		setHasChanges(true);
	};

	const handleSave = () => {
		const preferences: NotificationPreference[] = [];
		Object.entries(localPreferences).forEach(([category, channels]) => {
			Object.entries(channels).forEach(([channel, enabled]) => {
				preferences.push({
					category,
					channel,
					enabled,
				} as NotificationPreference);
			});
		});
		updateMutation.mutate(preferences);
	};

	const handleReset = () => {
		if (data?.preferences) {
			const prefs: Record<string, Record<string, boolean>> = {};
			data.preferences.forEach((pref) => {
				if (!prefs[pref.category]) {
					prefs[pref.category] = {};
				}
				prefs[pref.category][pref.channel] = pref.enabled;
			});
			setLocalPreferences(prefs);
			setHasChanges(false);
		}
	};

	// Get unique categories and channels from preferences
	const categories = useMemo(
		() =>
			data?.preferences
				? Array.from(new Set(data.preferences.map((p) => p.category)))
				: [],
		[data],
	);

	const channels = useMemo(
		() =>
			data?.preferences
				? Array.from(new Set(data.preferences.map((p) => p.channel)))
				: [],
		[data],
	);

	// Check if a channel is globally disabled
	const isChannelGloballyDisabled = (channel: string): boolean => {
		return localPreferences.global?.[channel] === false;
	};

	// Separate global from other categories
	const otherCategories = categories.filter((cat) => cat !== "global");

	if (error) {
		return (
			<div className="p-8 h-auto flex flex-col gap-8">
				<div>
					<h1 className="text-3xl font-bold">
						Notification Preferences
					</h1>
					<p className="text-sm text-muted-foreground mt-2">
						Customize how you receive notifications across different
						channels.
					</p>
				</div>
				<Alert>
					<TbInfoCircle className="h-4 w-4" />
					<AlertDescription>
						Notification preferences feature is currently disabled
						or not available. Please contact your administrator.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="p-8 h-auto flex flex-col gap-8">
				<div>
					<h1 className="text-3xl font-bold">
						Notification Preferences
					</h1>
					<p className="text-sm text-muted-foreground mt-2">
						Customize how you receive notifications across different
						channels.
					</p>
				</div>
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<LoadingSpinner />
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-8 h-auto flex flex-col gap-8">
			<div>
				<h1 className="text-3xl font-bold">Notification Preferences</h1>
				<p className="text-sm text-muted-foreground mt-2">
					Customize how you receive notifications across different
					channels.
				</p>
			</div>

			<div className="space-y-6">
				{/* Global Notification Settings */}
				<Card>
					<CardHeader>
						<CardTitle>{CATEGORY_LABELS.global}</CardTitle>
						<CardDescription>
							Master controls for all notification channels.
							Disabling a channel here will disable it for all
							categories.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							{channels.map((channel) => {
								const isEnabled =
									localPreferences.global?.[channel] ?? true;

								return (
									<div
										key={channel}
										className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
									>
										<div className="flex-1 space-y-1 mr-3">
											<p className="text-sm font-medium leading-none">
												{CHANNEL_LABELS[channel] ||
													channel}
											</p>
											<p className="text-xs text-muted-foreground">
												{CHANNEL_DESCRIPTIONS[
													channel
												] ||
													`Enable ${channel} notifications`}
											</p>
										</div>
										<Switch
											checked={isEnabled}
											onCheckedChange={(checked) =>
												handleToggle(
													"global",
													channel,
													checked,
												)
											}
											disabled={updateMutation.isPending}
										/>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Category-Specific Settings */}
				<Card>
					<CardHeader>
						<CardTitle>Per Category</CardTitle>
						<CardDescription>
							Fine-tune notification preferences for specific
							categories. These settings only work when the
							channel is enabled globally.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{otherCategories.map((category) => (
								<div
									key={category}
									className="p-6 rounded-lg border bg-card space-y-4"
								>
									<div>
										<h3 className="text-base font-semibold">
											{CATEGORY_LABELS[category] ||
												category}
										</h3>
										<p className="text-sm text-muted-foreground mt-1">
											{CATEGORY_DESCRIPTIONS[category] ||
												`Notifications for ${category}`}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-3">
										{channels.map((channel) => {
											const isEnabled =
												localPreferences[category]?.[
													channel
												] ?? true;
											const isGloballyDisabled =
												isChannelGloballyDisabled(
													channel,
												);

											return (
												<div
													key={channel}
													className={`flex items-center justify-between p-3 rounded-md border bg-background transition-colors ${
														isGloballyDisabled
															? "opacity-50"
															: "hover:bg-accent/30"
													}`}
												>
													<p className="text-sm font-medium">
														{CHANNEL_LABELS[
															channel
														] || channel}
													</p>
													<Switch
														checked={
															isEnabled &&
															!isGloballyDisabled
														}
														onCheckedChange={(
															checked,
														) =>
															handleToggle(
																category,
																channel,
																checked,
															)
														}
														disabled={
															updateMutation.isPending ||
															isGloballyDisabled
														}
													/>
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Save/Reset Footer */}
			{hasChanges && (
				<Card>
					<CardFooter className="flex justify-end gap-3 py-4">
						<Button
							variant="outline"
							onClick={handleReset}
							disabled={updateMutation.isPending}
						>
							Reset Changes
						</Button>
						<Button
							onClick={handleSave}
							disabled={updateMutation.isPending}
						>
							{updateMutation.isPending ? (
								<>
									<LoadingSpinner className="mr-2" />
									Saving...
								</>
							) : (
								<>
									<TbDeviceFloppy className="mr-2 h-4 w-4" />
									Save Preferences
								</>
							)}
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	);
}
