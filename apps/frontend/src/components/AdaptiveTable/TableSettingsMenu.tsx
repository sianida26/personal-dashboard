import {
	Button,
	Checkbox,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@repo/ui";
import type { SortingState, Table } from "@tanstack/react-table";
import { ChevronRight, Settings } from "lucide-react";
import { TbCaretDownFilled, TbCaretUpFilled } from "react-icons/tb";
import type { AdaptiveColumnDef } from "./types";

interface TableSettingsMenuProps<T> {
	table: Table<T>;
	columnVisibilityToggle: boolean;
	groupable: boolean;
	groupBy: string | null;
	onGroupByChange: (groupBy: string | null) => void;
	paginationType: "client" | "server";
	sortable: boolean;
	sorting: SortingState;
	onSortingChange: (sorting: SortingState) => void;
}

export function TableSettingsMenu<T>({
	table,
	columnVisibilityToggle,
	groupable,
	groupBy,
	onGroupByChange,
	paginationType,
	sortable,
	sorting,
	onSortingChange,
}: TableSettingsMenuProps<T>) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm">
					<Settings className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-48 p-1" align="end">
				<div className="space-y-0.5">
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
							>
								<span>Column Visibility</span>
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</button>
						</PopoverTrigger>
						<PopoverContent
							className="w-64"
							align="start"
							side="right"
							sideOffset={4}
						>
							<div className="space-y-4">
								<div>
									<h4 className="font-medium mb-3">
										Property visibility
									</h4>
									<div className="relative mb-3">
										<Input
											placeholder="Search for a property..."
											className="h-9"
										/>
									</div>
								</div>
								<Separator />
								<div>
									<p className="text-sm text-muted-foreground mb-2">
										Shown in table
									</p>
									<ScrollArea className="h-48">
										<div className="space-y-1">
											{table
												.getAllLeafColumns()
												.filter((column) => {
													const columnDef =
														column.columnDef as AdaptiveColumnDef<T>;
													const hasVisibilityToggle =
														columnDef.visibilityToggle ??
														columnVisibilityToggle;
													return (
														column.getIsVisible() &&
														column.id !==
															"_actions" &&
														hasVisibilityToggle !==
															false
													);
												})
												.map((column) => (
													<div
														key={column.id}
														className="flex items-center"
													>
														<button
															type="button"
															className="flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1 rounded-sm"
														>
															<Checkbox
																checked={column.getIsVisible()}
																onCheckedChange={(
																	value,
																) =>
																	column.toggleVisibility(
																		!!value,
																	)
																}
															/>
															<Label className="text-sm font-normal cursor-pointer flex-1">
																{typeof column
																	.columnDef
																	.header ===
																"string"
																	? column
																			.columnDef
																			.header
																	: column.id}
															</Label>
														</button>
													</div>
												))}
										</div>
									</ScrollArea>
								</div>
								{table.getAllLeafColumns().some((column) => {
									const columnDef =
										column.columnDef as AdaptiveColumnDef<T>;
									const hasVisibilityToggle =
										columnDef.visibilityToggle ??
										columnVisibilityToggle;
									return (
										!column.getIsVisible() &&
										column.id !== "_actions" &&
										hasVisibilityToggle !== false
									);
								}) && (
									<>
										<Separator />
										<div>
											<p className="text-sm text-muted-foreground mb-2">
												Hidden
											</p>
											<div className="space-y-1">
												{table
													.getAllLeafColumns()
													.filter((column) => {
														const columnDef =
															column.columnDef as AdaptiveColumnDef<T>;
														const hasVisibilityToggle =
															columnDef.visibilityToggle ??
															columnVisibilityToggle;
														return (
															!column.getIsVisible() &&
															column.id !==
																"_actions" &&
															hasVisibilityToggle !==
																false
														);
													})
													.map((column) => (
														<div
															key={column.id}
															className="flex items-center"
														>
															<button
																type="button"
																className="flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1 rounded-sm"
															>
																<Checkbox
																	checked={column.getIsVisible()}
																	onCheckedChange={(
																		value,
																	) =>
																		column.toggleVisibility(
																			!!value,
																		)
																	}
																/>
																<Label className="text-sm font-normal cursor-pointer flex-1">
																	{typeof column
																		.columnDef
																		.header ===
																	"string"
																		? column
																				.columnDef
																				.header
																		: column.id}
																</Label>
															</button>
														</div>
													))}
											</div>
										</div>
									</>
								)}
							</div>
						</PopoverContent>
					</Popover>
					{groupable && paginationType !== "server" && (
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
								>
									<span>Group By</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</button>
							</PopoverTrigger>
							<PopoverContent
								className="w-64"
								align="start"
								side="right"
								sideOffset={4}
							>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">
											Group by property
										</h4>
										{groupBy && (
											<Button
												variant="secondary"
												size="sm"
												onClick={() =>
													onGroupByChange(null)
												}
												className="h-6 px-2"
											>
												Clear
											</Button>
										)}
									</div>
									<Separator />
									<ScrollArea className="h-48">
										<div className="space-y-1">
											{table
												.getAllLeafColumns()
												.filter(
													(column) =>
														column.id !==
														"_actions",
												)
												.map((column) => {
													const isSelected =
														groupBy === column.id;
													return (
														<button
															key={column.id}
															type="button"
															onClick={() =>
																onGroupByChange(
																	column.id,
																)
															}
															className={`flex items-center gap-2 w-full text-left hover:bg-accent px-2 py-1.5 rounded-sm text-sm transition-colors ${
																isSelected
																	? "bg-accent"
																	: ""
															}`}
														>
															<div
																className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
																	isSelected
																		? "bg-primary border-primary"
																		: "border-input"
																}`}
															>
																{isSelected && (
																	<div className="w-2 h-2 bg-primary-foreground rounded-sm" />
																)}
															</div>
															<span>
																{typeof column
																	.columnDef
																	.header ===
																"string"
																	? column
																			.columnDef
																			.header
																	: column.id}
															</span>
														</button>
													);
												})}
										</div>
									</ScrollArea>
								</div>
							</PopoverContent>
						</Popover>
					)}
					{sortable && (
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
								>
									<span>Sort</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</button>
							</PopoverTrigger>
							<PopoverContent
								className="w-64"
								align="start"
								side="right"
								sideOffset={4}
							>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">Sort</h4>
										{sorting.length > 0 && (
											<Button
												variant="secondary"
												size="sm"
												onClick={() =>
													onSortingChange([])
												}
												className="h-6 px-2"
											>
												Clear
											</Button>
										)}
									</div>
									<Separator />
									<ScrollArea className="h-48">
										<div className="space-y-2">
											{table
												.getAllLeafColumns()
												.filter((column) => {
													const columnDef =
														column.columnDef as AdaptiveColumnDef<T>;
													const isSortable =
														columnDef.sortable ??
														sortable;
													return (
														column.id !==
															"_actions" &&
														isSortable
													);
												})
												.map((column) => {
													const sortedState =
														column.getIsSorted();
													return (
														<div
															key={column.id}
															className="flex items-center justify-between gap-3 py-1 w-11/12"
														>
															{/* Label kiri */}
															<div className="min-w-0">
																<div className="truncate text-xs font-medium text-foreground/90">
																	{typeof column
																		.columnDef
																		.header ===
																	"string"
																		? column
																				.columnDef
																				.header
																		: column.id}
																</div>
															</div>

															{/* Kontrol kanan */}
															<div className="flex items-center gap-1">
																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<button
																			type="button"
																			onClick={() =>
																				column.toggleSorting(
																					false,
																				)
																			}
																			className={[
																				"inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
																				"transition-colors",
																				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
																				sortedState ===
																				"asc"
																					? "bg-muted text-foreground"
																					: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
																			].join(
																				" ",
																			)}
																			aria-pressed={
																				sortedState ===
																				"asc"
																			}
																		>
																			<TbCaretUpFilled className="h-3.5 w-3.5" />
																			Asc
																		</button>
																	</TooltipTrigger>
																	<TooltipContent
																		side="top"
																		className="text-xs"
																	>
																		Sort
																		ascending
																		(A → Z /
																		1 → 9)
																	</TooltipContent>
																</Tooltip>

																<Tooltip>
																	<TooltipTrigger
																		asChild
																	>
																		<button
																			type="button"
																			onClick={() =>
																				column.toggleSorting(
																					true,
																				)
																			}
																			className={[
																				"inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
																				"transition-colors",
																				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
																				sortedState ===
																				"desc"
																					? "bg-muted text-foreground"
																					: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
																			].join(
																				" ",
																			)}
																			aria-pressed={
																				sortedState ===
																				"desc"
																			}
																		>
																			<TbCaretDownFilled className="h-3.5 w-3.5" />
																			Desc
																		</button>
																	</TooltipTrigger>
																	<TooltipContent
																		side="top"
																		className="text-xs"
																	>
																		Sort
																		descending
																		(Z → A /
																		9 → 1)
																	</TooltipContent>
																</Tooltip>
															</div>
														</div>
													);
												})}
										</div>
									</ScrollArea>
								</div>
							</PopoverContent>
						</Popover>
					)}
					{!groupable && !sortable && (
						<button
							type="button"
							className="flex items-center justify-between w-full text-left hover:bg-accent px-3 py-2 rounded-sm text-sm transition-colors"
							onClick={() => {
								// TODO: Implement additional functionality
							}}
						>
							<span>More Options</span>
							<ChevronRight className="h-4 w-4 text-muted-foreground" />
						</button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
