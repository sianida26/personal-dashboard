import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	LoadingSpinner,
	ScrollArea,
	Textarea,
} from "@repo/ui";
import { useToast } from "@repo/ui/hooks";
import { cn } from "@repo/ui/utils";
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	executeNotificationAction,
	fetchNotifications,
	markNotification,
	markNotifications,
	type NotificationListQuery,
} from "@/modules/notifications/api";
import { notificationQueryKeys } from "@/modules/notifications/queryKeys";
import type { Notification, NotificationGroup } from "@/modules/notifications/types";
import { authDB } from "@/indexedDB/authDB";
import { backendUrl } from "@/honoClient";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/_dashboardLayout/notifications/")({
	component: NotificationsPage,
	staticData: {
		title: "Notifications",
	},
});

type FilterDefinition = {
	label: string;
	key: string;
	description?: string;
	query: NotificationListQuery;
};

const filters: FilterDefinition[] = [
	{ label: "All", key: "all", query: {} },
	{
		label: "Unread",
		key: "status:unread",
		query: { status: "unread" },
		description: "Only show messages you have not opened yet.",
	},
	{
		label: "Approvals",
		key: "type:approval",
		query: { type: "approval" },
		description: "Highlight the requests that need a decision.",
	},
	{
		label: "System",
		key: "category:system",
		query: { category: "system" },
		description: "Infrastructure and status notifications.",
	},
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

const PAGE_SIZE = 20;

const GROUP_ORDER: NotificationGroup["key"][] = [
	"today",
	"yesterday",
	"thisWeek",
	"earlier",
];

const resolveGroupForDate = (isoString: string) => {
	const created = dayjs(isoString);
	const today = dayjs().startOf("day");
	const createdDay = created.startOf("day");
	const dayDiff = today.diff(createdDay, "day");

	if (dayDiff === 0) {
		return { key: "today", title: "Today" } as const;
	}

	if (dayDiff === 1) {
		return { key: "yesterday", title: "Yesterday" } as const;
	}

	if (dayDiff <= 7) {
		return { key: "thisWeek", title: "This Week" } as const;
	}

	return { key: "earlier", title: "Earlier" } as const;
};

const groupNotificationsByDate = (
	items: Notification[],
): NotificationGroup[] => {
	const groups = new Map<NotificationGroup["key"], NotificationGroup>();

	for (const item of items) {
		const { key, title } = resolveGroupForDate(item.createdAt);
		const existing = groups.get(key);

		if (existing) {
			existing.notifications.push(item);
		} else {
			groups.set(key, {
				key,
				title,
				notifications: [item],
			});
		}
	}

	return GROUP_ORDER.map((key) => groups.get(key)).filter(
		(group): group is NotificationGroup => Boolean(group),
	);
};

function NotificationsPage() {
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [activeFilterKey, setActiveFilterKey] = useState<string>(
		filters[0]?.key ?? "all",
	);
	const [activeIndex, setActiveIndex] = useState(0);
	const [actionComment, setActionComment] = useState("");
	const [selectedActionKey, setSelectedActionKey] = useState<string | null>(
		null,
	);
	const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

	const activeFilter =
		filters.find((item) => item.key === activeFilterKey) ?? filters[0];
	const {
		data,
		isLoading,
		isFetching,
		isError,
		error,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: notificationQueryKeys.list(activeFilterKey),
		initialPageParam: undefined as string | undefined,
		queryFn: ({ pageParam }) =>
			fetchNotifications({
				...activeFilter.query,
				cursor:
					typeof pageParam === "string" ? pageParam : undefined,
				limit: PAGE_SIZE,
			}),
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});

	const notificationsList = useMemo(
		() => data?.pages.flatMap((page) => page.items ?? []) ?? [],
		[data],
	);
	const notificationIndexLookup = useMemo(() => {
		const map = new Map<string, number>();
		notificationsList.forEach((item, index) => {
			map.set(item.id, index);
		});
		return map;
	}, [notificationsList]);
	const groupedNotifications = useMemo(
		() => groupNotificationsByDate(notificationsList),
		[notificationsList],
	);
	const hasUnread = useMemo(
		() => notificationsList.some((item) => item.status === "unread"),
		[notificationsList],
	);
	const selectedNotification = notificationsList[activeIndex] ?? null;
	const metadataRecord = (selectedNotification?.metadata ?? {}) as Record<
		string,
		unknown
	>;
	const selectedAction =
		selectedNotification?.actions.find(
			(action) => action.actionKey === selectedActionKey,
		) ?? null;
	const selectedActionRequiresComment =
		selectedAction?.requiresComment ?? false;
	const optimisticallyMarkNotificationAsRead = useCallback(
		(notificationId: string) => {
			const readTimestamp = new Date().toISOString();
			queryClient.setQueryData<
				InfiniteData<
					PaginatedNotificationsResponse,
					string | undefined
				>
			>(notificationQueryKeys.list(activeFilterKey), (current) => {
				if (!current) return current;
				let didUpdate = false;

				const updateCollection = (items: Notification[]) => {
					let collectionUpdated = false;
					const nextItems = items.map((item) => {
						if (
							item.id !== notificationId ||
							item.status === "read"
						) {
							return item;
						}
						collectionUpdated = true;
						didUpdate = true;
						return {
							...item,
							status: "read" as const,
							readAt: item.readAt ?? readTimestamp,
						};
					});
					return collectionUpdated ? nextItems : items;
				};

				const pages = current.pages.map((page) => {
					const updatedItems = page.items
						? updateCollection(page.items)
						: page.items;
					const updatedGroups = page.groups?.map((group) => {
						const updatedGroupNotifications = updateCollection(
							group.notifications,
						);
						if (
							updatedGroupNotifications === group.notifications
						) {
							return group;
						}
						return {
							...group,
							notifications: updatedGroupNotifications,
						};
					});

					if (
						updatedItems === page.items &&
						updatedGroups === page.groups
					) {
						return page;
					}

					return {
						...page,
						items: updatedItems,
						groups: updatedGroups ?? page.groups,
					};
				});

				return didUpdate ? { ...current, pages } : current;
			});

			queryClient.setQueryData<number>(
				notificationQueryKeys.unreadCount,
				(current) => {
					if (typeof current !== "number") return current;
					return current > 0 ? current - 1 : 0;
				},
			);
		},
		[activeFilterKey, queryClient],
	);
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
			return cleanRecord ? JSON.stringify(cleanRecord, null, 2) : "";
		} catch {
			return "";
		}
	}, [metadataRecord]);
	const metadataEntries = useMemo(
		() =>
			Object.entries(metadataRecord).filter(
				([, value]) => value !== undefined && value !== null,
			),
		[metadataRecord],
	);

	useEffect(() => {
		setActiveIndex(0);
	}, [activeFilterKey, notificationsList.length]);

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

	useEffect(() => {
		let eventSource: EventSource | null = null;
		let retryTimeout: ReturnType<typeof setTimeout> | null = null;
		let cancelled = false;

		const connect = async () => {
			const auth = await authDB.auth.get("auth");
			if (cancelled) return;
			const token = auth?.accessToken;
			if (!token) return;

			const url = new URL(`${backendUrl}/notifications/stream`);
			url.searchParams.set("token", token);

			eventSource = new EventSource(url.toString());

			const handleMessage = (event: MessageEvent) => {
				try {
					const payload = JSON.parse(String(event.data)) as {
						title?: string;
						message?: string;
					};

					toast({
						title: payload.title ?? "New notification",
						description:
							payload.message ??
							"A new update just landed in your inbox.",
					});
				} catch {
					toast({
						title: "New notification",
						description:
							"A new update just landed in your inbox.",
					});
				}

				void queryClient.invalidateQueries({
					queryKey: notificationQueryKeys.all,
					exact: false,
				});
				void queryClient.invalidateQueries({
					queryKey: notificationQueryKeys.unreadCount,
				});
			};

			eventSource.addEventListener("notification", handleMessage);

			eventSource.onerror = () => {
				eventSource?.close();
				if (cancelled) return;
				if (retryTimeout) {
					clearTimeout(retryTimeout);
				}
				retryTimeout = setTimeout(() => {
					void connect();
				}, 5000);
			};
		};

		void connect();

		return () => {
			cancelled = true;
			eventSource?.close();
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
		};
	}, [queryClient, toast]);

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
			queryKey: notificationQueryKeys.all,
			exact: false,
		});
		queryClient.invalidateQueries({
			queryKey: notificationQueryKeys.list(activeFilterKey),
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
			queryKey: notificationQueryKeys.all,
			exact: false,
		});
		queryClient.invalidateQueries({
			queryKey: notificationQueryKeys.list(activeFilterKey),
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

	const autoMarkReadMutation = useMutation({
		mutationFn: (id: string) => markNotification(id, "read"),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.all,
				exact: false,
			});
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list(activeFilterKey),
			});
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.unreadCount,
			});
		},
		onError: (mutationError: unknown) => {
			console.error(
				"Failed to auto mark notification as read",
				mutationError,
			);
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
			queryKey: notificationQueryKeys.all,
			exact: false,
		});
		queryClient.invalidateQueries({
			queryKey: notificationQueryKeys.list(activeFilterKey),
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

	const handleNotificationSelect = (index: number) => {
		if (index < 0 || index >= notificationsList.length) {
			return;
		}
		setActiveIndex(index);
		const notification = notificationsList[index];
		if (!notification || notification.status === "read") {
			return;
		}
		optimisticallyMarkNotificationAsRead(notification.id);
		autoMarkReadMutation.mutate(notification.id);
	};

	const markCurrent = (status: "read" | "unread") => {
		const current = notificationsList[activeIndex];
		if (!current) return;
		singleMutation.mutate({ id: current.id, status });
	};

	const selectPreviousNotification = () => {
		const previousIndex = Math.max(activeIndex - 1, 0);
		if (previousIndex === activeIndex) return;
		handleNotificationSelect(previousIndex);
	};

	const selectNextNotification = () => {
		const nextIndex = Math.min(
			activeIndex + 1,
			notificationsList.length - 1,
		);
		if (nextIndex === activeIndex) return;
		handleNotificationSelect(nextIndex);
	};

	const hasUnreadSelection = selectedNotification?.status === "unread";
	// Keep metadata helpers wired for future integrations, but hide the card for the current non-technical experience.
	const showReferenceCard = false;

	const handleSubmitAction = () => {
		if (!selectedNotification || !selectedAction) {
			toast({
				title: "Pick an option",
				description:
					"Choose how you’d like to respond before submitting.",
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
			comment: selectedAction.requiresComment
				? trimmedComment
				: undefined,
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
					There are no updates right now. We’ll place new messages
					here automatically.
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
							<div className="space-y-4 px-2 pb-3">
								{groupedNotifications.map((group) => (
									<div key={group.key} className="space-y-2">
										<p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
											{group.title}
										</p>
										<div className="space-y-1.5">
											{group.notifications.map(
												(notification) => {
													const index =
														notificationIndexLookup.get(
															notification.id,
														) ?? 0;
													const isActive =
														index === activeIndex;
													return (
														<button
															type="button"
															key={
																notification.id
															}
															onClick={() =>
																handleNotificationSelect(
																	index,
																)
															}
															className={cn(
																"w-full rounded-md border px-3 py-3 text-left transition",
																isActive
																	? "border-primary bg-primary/10"
																	: "border-transparent hover:border-primary/40",
															)}
														>
															<div className="flex items-start justify-between gap-2">
																<div className="space-y-1">
																	{notification.category && (
																		<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
																			{friendlyLabel(
																				notification.category ??
																					"",
																			)}
																		</span>
																	)}
																	<p className="text-sm font-medium">
																		{
																			notification.title
																		}
																	</p>
																	<p className="text-xs text-muted-foreground line-clamp-2">
																		{
																			notification.message
																		}
																	</p>
																</div>
																{notification.status ===
																	"unread" && (
																	<Badge variant="default">
																		New
																	</Badge>
																)}
															</div>
															<p className="mt-2 text-xs text-muted-foreground">
																{dayjs(
																	notification.createdAt,
																).fromNow()}
															</p>
														</button>
													);
												},
											)}
										</div>
									</div>
								))}
								{hasNextPage && (
									<div className="pt-2">
										<Button
											variant="ghost"
											size="sm"
											className="w-full"
											onClick={() => fetchNextPage()}
											disabled={isFetchingNextPage}
										>
											{isFetchingNextPage
												? "Loading more…"
												: "Load older updates"}
										</Button>
									</div>
								)}
								{!hasNextPage &&
									notificationsList.length > 0 && (
										<p className="px-1 text-center text-[11px] text-muted-foreground">
											You’ve reached the end of your
											inbox.
										</p>
									)}
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
							{selectedNotification.category && (
								<Badge variant="outline">
									{friendlyLabel(
										selectedNotification.category,
									)}
								</Badge>
							)}
							<span>
								Sent{" "}
								{dayjs(selectedNotification.createdAt).format(
									"MMM D, YYYY h:mm A",
								)}
							</span>
							{isFetching && <LoadingSpinner size="sm" />}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									markCurrent(
										hasUnreadSelection ? "read" : "unread",
									)
								}
								disabled={singleMutation.isPending}
							>
								{hasUnreadSelection
									? "Mark as read"
									: "Mark as unread"}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={selectPreviousNotification}
								disabled={activeIndex === 0}
							>
								Previous
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={selectNextNotification}
								disabled={
									activeIndex >= notificationsList.length - 1
								}
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
												{selectedNotification.actions.map(
													(action) => {
														const friendlyAction =
															describeAction(
																action.actionKey,
																action.label,
															);
														const isSelected =
															selectedActionKey ===
															action.actionKey;
														return (
															<button
																type="button"
																key={action.id}
																onClick={() => {
																	setSelectedActionKey(
																		action.actionKey,
																	);
																	if (
																		!action.requiresComment
																	) {
																		setActionComment(
																			"",
																		);
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
																			{
																				friendlyAction.title
																			}
																		</p>
																		{friendlyAction.helper && (
																			<p className="text-xs text-muted-foreground">
																				{
																					friendlyAction.helper
																				}
																			</p>
																		)}
																		{action.requiresComment && (
																			<p className="text-xs text-muted-foreground">
																				Add
																				a
																				quick
																				note
																				if
																				you
																				choose
																				this
																				option.
																			</p>
																		)}
																	</div>
																	{isSelected && (
																		<Badge variant="default">
																			Selected
																		</Badge>
																	)}
																</div>
															</button>
														);
													},
												)}
											</div>
											{selectedActionRequiresComment && (
												<div className="space-y-2">
													<Textarea
														value={actionComment}
														onChange={(event) =>
															setActionComment(
																event.target
																	.value,
															)
														}
														placeholder="Share a short note so the team knows what needs to change."
														className="resize-none"
													/>
													<p className="text-xs text-muted-foreground">
														Notes help teammates
														understand your request.
													</p>
												</div>
											)}
											<Button
												onClick={handleSubmitAction}
												disabled={
													!selectedAction ||
													actionMutation.isPending
												}
											>
												{actionMutation.isPending
													? "Sending…"
													: "Submit decision"}
											</Button>
										</CardContent>
									</Card>
								)}

								{showReferenceCard &&
									metadataEntries.length > 0 && (
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
															onClick={() =>
																setShowTechnicalDetails(
																	(prev) =>
																		!prev,
																)
															}
														>
															{showTechnicalDetails
																? "Hide developer data"
																: "Show developer data"}
														</Button>
													)}
												</div>
												{friendlyMetadata.items.length >
												0 ? (
													<ul className="space-y-2 text-sm">
														{friendlyMetadata.items.map(
															(item) => (
																<li
																	key={
																		item.label
																	}
																	className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
																>
																	<span className="font-medium">
																		{
																			item.label
																		}
																	</span>
																	<span className="text-muted-foreground">
																		{
																			item.value
																		}
																	</span>
																</li>
															),
														)}
													</ul>
												) : (
													<p className="text-xs text-muted-foreground">
														This message may include
														extra details for
														connected tools and
														other apps. Nothing else
														is needed from you.
													</p>
												)}
												{friendlyMetadata.linkHref && (
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															window.open(
																friendlyMetadata.linkHref,
																"_blank",
																"noopener",
															)
														}
													>
														{
															friendlyMetadata.linkLabel
														}
													</Button>
												)}
												{showTechnicalDetails &&
													developerMetadataJson && (
														<div className="space-y-2">
															{friendlyMetadata
																.leftoverEntries
																.length > 0 && (
																<div className="space-y-1 text-xs text-muted-foreground">
																	<p className="font-semibold text-foreground">
																		Other
																		data
																	</p>
																	<ul className="list-disc space-y-1 pl-4">
																		{friendlyMetadata.leftoverEntries.map(
																			(
																				entry,
																			) => (
																				<li
																					key={
																						entry.key
																					}
																				>
																					<strong>
																						{friendlyLabel(
																							entry.key,
																						)}
																						:
																					</strong>{" "}
																					{
																						entry.value
																					}
																				</li>
																			),
																		)}
																	</ul>
																</div>
															)}
															<pre className="whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
																{
																	developerMetadataJson
																}
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
												{selectedNotification.actionLogs.map(
													(log) => (
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
																	{dayjs(
																		log.actedAt,
																	).format(
																		"MMM D, YYYY h:mm A",
																	)}
																</span>
															</div>
															{log.comment && (
																<p className="mt-1 text-muted-foreground">
																	“
																	{
																		log.comment
																	}
																	”
																</p>
															)}
														</li>
													),
												)}
											</ul>
										</CardContent>
									</Card>
								)}

								<p className="text-xs text-muted-foreground">
									Viewing message {activeIndex + 1} of{" "}
									{notificationsList.length}
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
						A familiar inbox for every message that needs your
						attention.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (!hasUnread) {
							toast({
								title: "Nothing to mark",
								description:
									"Everything here is already read.",
							});
							return;
						}

						const unreadIds = notificationsList
							.filter((item) => item.status === "unread")
							.map((item) => item.id);

						bulkMutation.mutate({
							ids: unreadIds,
							markAs: "read",
						});
					}}
					disabled={bulkMutation.isPending || !hasUnread}
				>
					Mark everything as read
				</Button>
			</header>

			<div className="flex flex-wrap gap-2">
				{filters.map((entry) => (
					<Button
						key={entry.key}
						variant={
							activeFilterKey === entry.key
								? "default"
								: "outline"
						}
						size="sm"
						onClick={() => setActiveFilterKey(entry.key)}
						title={entry.description}
					>
						{entry.label}
					</Button>
				))}
			</div>
			{activeFilter?.description && (
				<p className="text-xs text-muted-foreground">
					{activeFilter.description}
				</p>
			)}

			{mainContent}
		</div>
	);
}

export default NotificationsPage;
