import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
	Badge,
	Button,
	LoadingSpinner,
	Textarea,
	Alert,
	AlertTitle,
	AlertDescription,
	Card,
	CardContent,
	ScrollArea,
} from "@repo/ui";
import { cn } from "@repo/ui/utils";
import { useToast } from "@repo/ui/hooks";
import {
	executeNotificationAction,
	fetchNotifications,
	markNotification,
	markNotifications,
	type NotificationListFilter,
} from "@/modules/notifications/api";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";
import type { Notification } from "@/modules/notifications/types";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/_dashboardLayout/notifications/")({
	component: NotificationsPage,
	staticData: {
		title: "Notifications",
	},
});

const filters: { label: string; value: NotificationListFilter }[] = [
	{ label: "All updates", value: "all" },
	{ label: "Unopened", value: "unread" },
	{ label: "Needs decision", value: "approval" },
	{ label: "Friendly updates", value: "informational" },
];

const friendlyLabel = (input: string) =>
	input
		.replace(/[_-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase());

const describeAction = (
	actionKey: string,
	label: string,
): { title: string; helper?: string } => {
	switch (actionKey.toLowerCase()) {
		case "approve":
			return {
				title: "Looks good",
				helper: "Let everyone know this is ready to move forward.",
			};
		case "request_changes":
			return {
				title: "Needs tweaks",
				helper: "Ask for a few updates before giving the green light.",
			};
		default:
			return {
				title: friendlyLabel(label),
			};
	}
};

function NotificationsPage() {
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [filter, setFilter] = useState<NotificationListFilter>("all");
	const [activeIndex, setActiveIndex] = useState(0);
	const [actionComment, setActionComment] = useState("");
	const [selectedActionKey, setSelectedActionKey] = useState<string | null>(
		null,
	);
	const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

	const { data, isLoading, isFetching, isError, error } = useQuery({
		queryKey: notificationQueryKeys.list(filter),
		queryFn: () => fetchNotifications(filter),
	});

	const notificationsList = data?.items ?? [];
	const selectedNotification = notificationsList[activeIndex] ?? null;
	const metadataRecord = (selectedNotification?.metadata ?? {}) as Record<string, unknown>;
	const selectedAction =
		selectedNotification?.actions.find(
			(action) => action.actionKey === selectedActionKey,
		) ?? null;
	const selectedActionRequiresComment =
		selectedAction?.requiresComment ?? false;
	const friendlyMetadata = useMemo(() => {
		const friendlyMappings: Record<string, string> = {
			resourceType: "Kind of update",
			resourceId: "Reference ID",
			reference: "Name",
			status: "Status",
			updatedBy: "Updated by",
			updatedAt: "Updated on",
			actedBy: "Handled by",
			actedAt: "Handled on",
		};
		const friendlyItems: Array<{ label: string; value: string }> = [];
		const leftoverEntries: Array<{ key: string; value: string }> = [];

		for (const [key, value] of Object.entries(metadataRecord)) {
			if (value === undefined || value === null) continue;
			const stringValue = String(value);
			if (friendlyMappings[key]) {
				friendlyItems.push({
					label: friendlyMappings[key],
					value: friendlyLabel(stringValue),
				});
			} else if (typeof value === "string" || typeof value === "number") {
				leftoverEntries.push({
					key,
					value: stringValue,
				});
			}
		}

		const linkHref =
			typeof metadataRecord.linkHref === "string"
				? metadataRecord.linkHref
				: undefined;
		const linkLabel =
			typeof metadataRecord.linkLabel === "string"
				? metadataRecord.linkLabel
				: "Open related page";

		return {
			items: friendlyItems,
			linkHref,
			linkLabel,
			leftoverEntries,
		};
	}, [metadataRecord]);
	const developerMetadataJson = useMemo(() => {
		try {
			const cleanRecord = Object.keys(metadataRecord).length
				? metadataRecord
				: undefined;
			return cleanRecord
				? JSON.stringify(cleanRecord, null, 2)
				: "";
		} catch {
			return "";
		}
	}, [metadataRecord]);
	const metadataEntries = useMemo(
		() =>
			Object.entries(metadataRecord).filter(([, value]) =>
				value !== undefined && value !== null,
			),
		[metadataRecord],
	);

	useEffect(() => {
		setActiveIndex(0);
	}, [filter, notificationsList.length]);

	useEffect(() => {
		setActionComment("");
		setSelectedActionKey(null);
		setShowTechnicalDetails(false);
	}, [selectedNotification?.id]);

	useEffect(() => {
		if (selectedAction && !selectedAction.requiresComment) {
			setActionComment("");
		}
	}, [selectedAction?.actionKey, selectedAction?.requiresComment]);

	const bulkMutation = useMutation({
		mutationFn: ({
			ids,
			markAs,
		}: {
			ids: string[];
			markAs: "read" | "unread";
		}) => markNotifications(ids, markAs),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list(filter),
			});
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.unreadCount,
			});
		},
		onError: (mutationError: unknown) => {
			const message =
				mutationError instanceof Error
					? mutationError.message
					: "We couldn’t update the messages. Please try again.";
			toast({
				title: "That didn’t work",
				description: message,
				variant: "destructive",
			});
		},
	});

	const singleMutation = useMutation({
		mutationFn: ({
			id,
			status,
		}: {
			id: string;
			status: "read" | "unread";
		}) => markNotification(id, status),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list(filter),
			});
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.unreadCount,
			});
		},
		onError: (mutationError: unknown) => {
			const message =
				mutationError instanceof Error
					? mutationError.message
					: "We couldn’t update the message. Please try again.";
			toast({
				title: "That didn’t work",
				description: message,
				variant: "destructive",
			});
		},
	});

	const actionMutation = useMutation({
		mutationFn: ({
			notificationId,
			actionKey,
			comment,
		}: {
			notificationId: string;
			actionKey: string;
			comment?: string;
		}) => executeNotificationAction(notificationId, actionKey, comment),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list(filter),
			});
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.unreadCount,
			});
			setActionComment("");
			setSelectedActionKey(null);
			toast({
				title: "All set!",
				description: "Your decision has been recorded.",
			});
		},
		onError: (mutationError: unknown) => {
			const message =
				mutationError instanceof Error
					? mutationError.message
					: "We couldn’t save that decision. Please try again.";
			toast({
				title: "That didn’t work",
				description: message,
				variant: "destructive",
			});
		},
	});

	const markCurrent = (status: "read" | "unread") => {
		const current = notificationsList[activeIndex];
		if (!current) return;
		singleMutation.mutate({ id: current.id, status });
	};

const hasUnreadSelection = selectedNotification?.status === "unread";
// Keep metadata helpers wired for future integrations, but hide the card for the current non-technical experience.
const showReferenceCard = false;

const handleSubmitAction = () => {
	if (!selectedNotification || !selectedAction) {
		toast({
			title: "Pick an option",
			description: "Choose how you’d like to respond before submitting.",
			variant: "destructive",
		});
		return;
	}

	const trimmedComment = actionComment.trim();

	if (selectedAction.requiresComment && !trimmedComment) {
		toast({
			title: "A quick note helps",
			description:
				"This choice needs a short comment so teammates understand the decision.",
			variant: "destructive",
		});
		return;
	}

	actionMutation.mutate({
		notificationId: selectedNotification.id,
		actionKey: selectedAction.actionKey,
		comment: selectedAction.requiresComment ? trimmedComment : undefined,
	});
};

let mainContent: ReactNode;

	if (isLoading) {
		mainContent = (
			<div className="flex h-56 items-center justify-center rounded-lg border bg-card">
				<LoadingSpinner label="Gathering your updates…" />
			</div>
		);
	} else if (isError) {
		mainContent = (
			<Alert variant="destructive">
				<AlertTitle>We hit a snag</AlertTitle>
				<AlertDescription>
					{error instanceof Error
						? error.message
						: "We couldn’t load your notifications. Please try again."}
				</AlertDescription>
			</Alert>
		);
	} else if (!notificationsList.length) {
		mainContent = (
			<Alert>
				<AlertTitle>All caught up</AlertTitle>
				<AlertDescription>
					There are no updates right now. We’ll place new messages here automatically.
				</AlertDescription>
			</Alert>
		);
	} else if (!selectedNotification) {
		mainContent = (
			<Alert>
				<AlertTitle>No message selected</AlertTitle>
				<AlertDescription>
					Choose a notification from the list to see the details.
				</AlertDescription>
			</Alert>
		);
	} else {
		mainContent = (
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm md:flex-row">
				<div className="flex w-full flex-col border-b md:w-80 md:border-b-0 md:border-r">
					<div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Inbox ({notificationsList.length})
					</div>
					<div className="min-h-0 flex-1">
						<ScrollArea className="h-72 md:h-full">
							<div className="space-y-1 px-2 pb-3">
								{notificationsList.map((notification, index) => {
									const isActive = index === activeIndex;
									return (
										<button
											type="button"
											key={notification.id}
											onClick={() => setActiveIndex(index)}
											className={`w-full rounded-md border px-3 py-3 text-left transition ${
												isActive
													? "border-primary bg-primary/10"
													: "border-transparent hover:border-primary/40"
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="space-y-1">
													<p className="text-sm font-medium">
														{notification.title}
													</p>
													<p className="text-xs text-muted-foreground line-clamp-2">
														{notification.message}
													</p>
												</div>
												{notification.status === "unread" && (
													<Badge variant="default">New</Badge>
												)}
											</div>
											<p className="mt-2 text-xs text-muted-foreground">
												{dayjs(notification.createdAt).fromNow()}
											</p>
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</div>
				</div>

				<div className="flex min-h-0 flex-1 flex-col">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<Badge variant="secondary">
								{selectedNotification.type === "approval"
									? "Needs decision"
									: "Update"}
							</Badge>
							<span>
								Sent{" "}
								{dayjs(selectedNotification.createdAt).format(
									"MMM D, YYYY h:mm A",
								)}
							</span>
							{selectedNotification.status === "unread" && (
								<Badge variant="outline">Unopened</Badge>
							)}
							{isFetching && <LoadingSpinner size="sm" />}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									markCurrent(hasUnreadSelection ? "read" : "unread")
								}
								disabled={singleMutation.isPending}
							>
								{hasUnreadSelection ? "Mark as read" : "Mark as unread"}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setActiveIndex((prev) => Math.max(prev - 1, 0))
								}
								disabled={activeIndex === 0}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setActiveIndex((prev) =>
										Math.min(prev + 1, notificationsList.length - 1),
									)
								}
								disabled={activeIndex >= notificationsList.length - 1}
							>
								Next
							</Button>
						</div>
					</div>

					<div className="min-h-0 flex-1">
						<ScrollArea className="h-96 md:h-full">
							<div className="space-y-4 p-4">
								<div className="space-y-2">
									<h2 className="text-xl font-semibold">
										{selectedNotification.title}
									</h2>
									<p className="text-sm leading-relaxed">
										{selectedNotification.message}
									</p>
								</div>

								{selectedNotification.type === "approval" && (
									<Card>
										<CardContent className="space-y-4 p-4">
											<p className="text-sm font-semibold text-muted-foreground">
												Take action
											</p>
											<div className="grid gap-3 sm:grid-cols-2">
												{selectedNotification.actions.map((action) => {
													const friendlyAction = describeAction(
														action.actionKey,
														action.label,
													);
													const isSelected =
														selectedActionKey === action.actionKey;
													return (
														<button
															type="button"
															key={action.id}
															onClick={() => {
																setSelectedActionKey(action.actionKey);
																if (!action.requiresComment) {
																	setActionComment("");
																}
															}}
															className={cn(
																"w-full rounded-md border p-3 text-left transition",
																isSelected
																	? "border-primary bg-primary/10 shadow-sm"
																	: "border-muted hover:border-primary/40",
															)}
														>
															<div className="flex items-start justify-between gap-2">
																<div className="space-y-1">
																	<p className="text-sm font-medium">
																		{friendlyAction.title}
																	</p>
																	{friendlyAction.helper && (
																		<p className="text-xs text-muted-foreground">
																			{friendlyAction.helper}
																		</p>
																	)}
																	{action.requiresComment && (
																		<p className="text-xs text-muted-foreground">
																			Add a quick note if you choose this option.
																		</p>
																	)}
																</div>
																{isSelected && (
																	<Badge variant="default">Selected</Badge>
																)}
															</div>
														</button>
													);
												})}
											</div>
											{selectedActionRequiresComment && (
												<div className="space-y-2">
													<Textarea
														value={actionComment}
														onChange={(event) =>
															setActionComment(event.target.value)
														}
														placeholder="Share a short note so the team knows what needs to change."
														className="resize-none"
													/>
													<p className="text-xs text-muted-foreground">
														Notes help teammates understand your request.
													</p>
												</div>
											)}
											<Button
												onClick={handleSubmitAction}
												disabled={!selectedAction || actionMutation.isPending}
											>
												{actionMutation.isPending
													? "Sending…"
													: "Submit decision"}
											</Button>
										</CardContent>
									</Card>
								)}

				{showReferenceCard && metadataEntries.length > 0 && (
					<Card>
						<CardContent className="space-y-3 p-4">
							<div className="flex items-center justify-between gap-2">
								<p className="text-sm font-semibold text-muted-foreground">
									Reference details
								</p>
								{developerMetadataJson && (
									<Button
										variant="ghost"
										size="xs"
										onClick={() => setShowTechnicalDetails((prev) => !prev)}
									>
										{showTechnicalDetails ? "Hide developer data" : "Show developer data"}
									</Button>
								)}
							</div>
							{friendlyMetadata.items.length > 0 ? (
								<ul className="space-y-2 text-sm">
									{friendlyMetadata.items.map((item) => (
										<li
											key={item.label}
											className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
										>
											<span className="font-medium">{item.label}</span>
											<span className="text-muted-foreground">{item.value}</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-xs text-muted-foreground">
									This message may include extra details for connected tools and other apps. Nothing else is needed from you.
								</p>
							)}
							{friendlyMetadata.linkHref && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => window.open(friendlyMetadata.linkHref, "_blank", "noopener")}
								>
									{friendlyMetadata.linkLabel}
								</Button>
							)}
							{showTechnicalDetails && developerMetadataJson && (
								<div className="space-y-2">
									{friendlyMetadata.leftoverEntries.length > 0 && (
										<div className="space-y-1 text-xs text-muted-foreground">
											<p className="font-semibold text-foreground">
												Other data
											</p>
											<ul className="list-disc space-y-1 pl-4">
												{friendlyMetadata.leftoverEntries.map((entry) => (
													<li key={entry.key}>
														<strong>{friendlyLabel(entry.key)}:</strong>{" "}
														{entry.value}
													</li>
												))}
											</ul>
										</div>
									)}
								<pre className="whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
									{developerMetadataJson}
								</pre>
								</div>
							)}
						</CardContent>
					</Card>
				)}

								{selectedNotification.actionLogs.length > 0 && (
									<Card>
										<CardContent className="space-y-2 p-4">
											<p className="text-sm font-semibold text-muted-foreground">
												Previous decisions
											</p>
											<ul className="space-y-2 text-sm">
												{selectedNotification.actionLogs.map((log) => (
													<li
														key={log.id}
														className="rounded-lg bg-muted/30 px-3 py-2"
													>
														<div className="flex justify-between">
															<span className="font-medium">
																{
																	describeAction(
																		log.actionKey,
																		log.actionKey,
																	).title
																}
															</span>
															<span className="text-xs text-muted-foreground">
																{dayjs(log.actedAt).format(
																	"MMM D, YYYY h:mm A",
																)}
															</span>
														</div>
														{log.comment && (
															<p className="mt-1 text-muted-foreground">
																“{log.comment}”
															</p>
														)}
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								)}

								<p className="text-xs text-muted-foreground">
									Viewing message {activeIndex + 1} of {notificationsList.length}
								</p>
							</div>
						</ScrollArea>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col gap-4 p-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold">Your updates</h1>
					<p className="text-sm text-muted-foreground">
						A familiar inbox for every message that needs your attention.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (!notificationsList.length) return;
						const unreadIds = notificationsList
							.filter((item) => item.status === "unread")
							.map((item) => item.id);

						if (!unreadIds.length) {
							toast({
								title: "Nothing to mark",
								description:
									"Everything here is already read.",
							});
							return;
						}

						bulkMutation.mutate({
							ids: unreadIds,
							markAs: "read",
						});
					}}
					disabled={bulkMutation.isPending}
				>
					Mark everything as read
				</Button>
			</header>

			<div className="flex flex-wrap gap-2">
				{filters.map((entry) => (
					<Button
						key={entry.value}
						variant={filter === entry.value ? "default" : "outline"}
						size="sm"
						onClick={() => setFilter(entry.value)}
					>
						{entry.label}
					</Button>
				))}
			</div>

			{mainContent}
		</div>
	);
}

export default NotificationsPage;
