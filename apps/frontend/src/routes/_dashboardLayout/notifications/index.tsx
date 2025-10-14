import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
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

const emptyMetadataCopy =
	"This update does not include extra details. You're all caught up!";

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

	const { data, isLoading, isFetching, isError, error } = useQuery({
		queryKey: notificationQueryKeys.list(filter),
		queryFn: () => fetchNotifications(filter),
	});

	const notificationsList = data?.items ?? [];
	const selectedNotification = notificationsList[activeIndex] ?? null;

	useEffect(() => {
		setActiveIndex(0);
	}, [filter, notificationsList.length]);

	useEffect(() => {
		setActionComment("");
	}, [selectedNotification?.id]);

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

	const handleAction = (actionId: string, requiresComment: boolean) => {
		if (!selectedNotification) return;

		const trimmedComment = actionComment.trim();

		if (requiresComment && !trimmedComment) {
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
			actionKey: actionId,
			comment: requiresComment ? trimmedComment : undefined,
		});
	};

	const hasUnreadSelection = selectedNotification?.status === "unread";
	const metadataEntries = Object.entries(
		selectedNotification?.metadata ?? {},
	).filter(([, value]) => value !== undefined && value !== null);

	let mainContent: React.ReactNode;

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
										<CardContent className="space-y-3 p-4">
											<p className="text-sm font-semibold text-muted-foreground">
												Take action
											</p>
											<div className="grid gap-3 sm:grid-cols-2">
												{selectedNotification.actions.map((action) => {
													const friendlyAction = describeAction(
														action.actionKey,
														action.label,
													);
													return (
														<div
															key={action.id}
															className="rounded-md border p-3"
														>
															<p className="text-sm font-medium">
																{friendlyAction.title}
															</p>
															{friendlyAction.helper && (
																<p className="mt-1 text-xs text-muted-foreground">
																	{friendlyAction.helper}
																</p>
															)}
															{action.requiresComment && (
																<p className="mt-1 text-xs text-muted-foreground">
																	Add a quick note before choosing this.
																</p>
															)}
															<Button
																size="sm"
																className="mt-3"
																onClick={() =>
																	handleAction(
																		action.actionKey,
																		action.requiresComment,
																	)
																}
																disabled={actionMutation.isPending}
															>
																{friendlyAction.title}
															</Button>
														</div>
													);
												})}
											</div>
											<Textarea
												value={actionComment}
												onChange={(event) =>
													setActionComment(event.target.value)
												}
												placeholder="Share a short note (optional unless required)…"
												className="resize-none"
											/>
											<p className="text-xs text-muted-foreground">
												Notes help teammates understand your choice.
											</p>
										</CardContent>
									</Card>
								)}

								{metadataEntries.length > 0 && (
									<Card>
										<CardContent className="space-y-3 p-4">
											<p className="text-sm font-semibold text-muted-foreground">
												Extra details
											</p>
											<ul className="space-y-2 text-sm">
												{metadataEntries.map(([key, value]) => (
													<li
														key={key}
														className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
													>
														<span className="font-medium">
															{friendlyLabel(key)}
														</span>
														<span className="text-muted-foreground">
															{String(value)}
														</span>
													</li>
												))}
											</ul>
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
