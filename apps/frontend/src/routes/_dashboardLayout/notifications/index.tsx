import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	LoadingSpinner,
	ScrollArea,
	Separator,
	Textarea,
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

const filters: {
	label: string;
	value: NotificationListFilter;
}[] = [
	{ label: "All", value: "all" },
	{ label: "Unread", value: "unread" },
	{ label: "Approvals", value: "approval" },
	{ label: "Informational", value: "informational" },
];

function NotificationsPage() {
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [filter, setFilter] = useState<NotificationListFilter>("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [actionComment, setActionComment] = useState("");

	const { data, isLoading, isFetching, isError, error } = useQuery({
		queryKey: notificationQueryKeys.list(filter),
		queryFn: () => fetchNotifications(filter),
	});

	const selectedNotification = useMemo<Notification | null>(() => {
		if (!data?.items?.length) return null;
		return (
			data.items.find((notification) => notification.id === selectedId) ??
			data.items[0]
		);
	}, [data, selectedId]);

	useEffect(() => {
		if (data?.items?.length && !selectedId) {
			setSelectedId(data.items[0]?.id ?? null);
		}
	}, [data, selectedId]);

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
					: "Failed to update notifications";
			toast({
				title: "Update failed",
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
					: "Failed to update notification";
			toast({
				title: "Update failed",
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
				title: "Action recorded",
				description: "The approval decision has been submitted.",
			});
		},
		onError: (mutationError: unknown) => {
			const message =
				mutationError instanceof Error
					? mutationError.message
					: "Failed to execute action";
			toast({
				title: "Action failed",
				description: message,
				variant: "destructive",
			});
		},
	});

	const markCurrent = (status: "read" | "unread") => {
		if (!selectedNotification) return;
		singleMutation.mutate({ id: selectedNotification.id, status });
	};

	const handleAction = (actionId: string, requiresComment: boolean) => {
		if (!selectedNotification) return;

		const trimmedComment = actionComment.trim();

		if (requiresComment && !trimmedComment) {
			toast({
				title: "Comment required",
				description: "Please provide a short comment before proceeding.",
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

	return (
		<div className="flex h-full flex-col md:flex-row">
			<div className="border-r md:w-80 lg:w-96">
				<div className="flex gap-2 p-4">
					{filters.map((entry) => (
						<Button
							key={entry.value}
							size="sm"
							variant={
								entry.value === filter ? "default" : "outline"
							}
							onClick={() => {
								setFilter(entry.value);
								setSelectedId(null);
							}}
						>
							{entry.label}
						</Button>
					))}
				</div>

				<Separator />

				{isLoading ? (
					<div className="flex h-64 items-center justify-center">
						<LoadingSpinner label="Loading notifications..." />
					</div>
				) : isError ? (
					<div className="p-4 text-sm text-destructive">
						Failed to load notifications:{" "}
						{error instanceof Error ? error.message : "Unknown"}
					</div>
				) : (
					<ScrollArea className="h-[calc(100vh-8rem)]">
						<div className="flex flex-col gap-6 p-4">
							{data?.groups?.length ? (
								data.groups.map((group) => (
									<div key={group.key}>
										<p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
											{group.title}
										</p>
										<div className="space-y-2">
											{group.notifications.map(
												(notification) => {
													const isActive =
														selectedNotification?.id ===
														notification.id;
													return (
														<button
															type="button"
															key={notification.id}
															onClick={() =>
																setSelectedId(
																	notification.id,
																)
															}
															className={`w-full rounded-md border p-3 text-left transition-colors ${
																isActive
																	? "border-primary bg-primary/5"
																	: "hover:border-primary/40"
															}`}
														>
															<div className="flex items-start justify-between gap-2">
																<div className="flex flex-col">
																	<span className="font-semibold text-sm">
																		{
																			notification.title
																		}
																	</span>
																	<span className="text-xs text-muted-foreground">
																		{dayjs(
																			notification.createdAt,
																		).fromNow()}
																	</span>
																</div>
																{notification.status ===
																	"unread" && (
																	<Badge variant="default">
																		Unread
																	</Badge>
																)}
															</div>
															<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
																{
																	notification.message
																}
															</p>
														</button>
													);
												},
											)}
										</div>
									</div>
								))
							) : (
								<div className="py-8 text-center text-sm text-muted-foreground">
									No notifications found for this filter.
								</div>
							)}
						</div>
					</ScrollArea>
				)}
			</div>

			<div className="flex flex-1 flex-col overflow-hidden">
				<div className="flex items-center justify-between border-b p-4">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">
							Notification Details
						</h2>
						{isFetching && <LoadingSpinner size="sm" />}
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								selectedNotification &&
								markCurrent(
									hasUnreadSelection ? "read" : "unread",
								)
							}
							disabled={
								!selectedNotification || singleMutation.isPending
							}
						>
							{hasUnreadSelection ? "Mark as read" : "Mark unread"}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								if (!data?.items?.length) return;
								const unreadIds =
									data.items
										.filter(
											(item) => item.status === "unread",
										)
										.map((item) => item.id) ?? [];

								if (!unreadIds.length) {
									toast({
										title: "No unread notifications",
										description:
											"All notifications are already read.",
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
							Mark all read
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-6">
					{selectedNotification ? (
						<Card className="h-full">
							<CardHeader>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<CardTitle className="text-xl">
										{selectedNotification.title}
									</CardTitle>
									<div className="flex items-center gap-2">
										<Badge variant="secondary">
											{selectedNotification.type}
										</Badge>
										<Badge variant="outline">
											{dayjs(
												selectedNotification.createdAt,
											).format(
												"MMM D, YYYY h:mm A",
											)}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-6">
								<section>
									<h3 className="text-sm font-semibold text-muted-foreground">
										Message
									</h3>
									<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
										{selectedNotification.message}
									</p>
								</section>

								{Object.keys(
									selectedNotification.metadata ?? {},
								).length > 0 && (
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground">
											Metadata
										</h3>
										<div className="mt-2 space-y-1 text-sm">
											{Object.entries(
												selectedNotification.metadata,
											).map(([key, value]) => (
												<div
													key={key}
													className="flex items-center justify-between gap-4 rounded border px-3 py-2"
												>
													<span className="font-medium">
														{key}
													</span>
													<span className="text-muted-foreground">
														{String(value)}
													</span>
												</div>
											))}
										</div>
									</section>
								)}

								{selectedNotification.type === "approval" && (
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground">
											Approval actions
										</h3>
										<div className="mt-3 space-y-3">
											{selectedNotification.actions.length ? (
												<>
													{selectedNotification.actions.map(
														(action) => (
															<div
																key={
																	action.id
																}
																className="flex items-center justify-between gap-4 rounded border px-3 py-2"
															>
																<div className="flex flex-col">
																	<span className="font-medium">
																		{
																			action.label
																		}
																	</span>
																	{action.requiresComment && (
																		<span className="text-xs text-muted-foreground">
																			Comment required
																		</span>
																	)}
																</div>
																<Button
																	size="sm"
																	onClick={() =>
																		handleAction(
																			action.actionKey,
																			action.requiresComment,
																		)
																	}
																	disabled={
																		actionMutation.isPending
																	}
																>
																	{
																		action.label
																	}
																</Button>
															</div>
														),
													)}
													<Textarea
														value={actionComment}
														onChange={(event) =>
															setActionComment(
																event.target
																	.value,
															)
														}
														placeholder="Add an approval note..."
													/>
												</>
											) : (
												<p className="text-sm text-muted-foreground">
													No actions configured for this notification.
												</p>
											)}
										</div>
									</section>
								)}

								{selectedNotification.actionLogs.length > 0 && (
									<section>
										<h3 className="text-sm font-semibold text-muted-foreground">
											Action history
										</h3>
										<div className="mt-3 space-y-2 text-sm">
											{selectedNotification.actionLogs.map(
												(log) => (
													<div
														key={log.id}
														className="rounded border px-3 py-2"
													>
														<div className="flex items-center justify-between gap-2">
															<span className="font-medium">
																{
																	log.actionKey
																}
															</span>
															<span className="text-xs text-muted-foreground">
																{dayjs(
																	log.actedAt,
																).format(
																	"MMM D, YYYY h:mm A",
																)}
															</span>
														</div>
														{log.comment && (
															<p className="mt-1 text-muted-foreground">
																{log.comment}
															</p>
														)}
													</div>
												),
											)}
										</div>
									</section>
								)}
							</CardContent>
						</Card>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
							No notification selected.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default NotificationsPage;
