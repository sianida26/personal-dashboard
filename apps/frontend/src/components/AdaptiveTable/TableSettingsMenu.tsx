import {
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@repo/ui";
import type { SortingState, Table } from "@tanstack/react-table";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Check,
	Eye,
	Group,
	Minus,
	RotateCcw,
	Settings,
	X,
} from "lucide-react";
import type { AdaptiveColumnDef, TableSettingsLabels } from "./types";
import { getValueByDataKey } from "node_modules/recharts/types/util/ChartUtils";

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
	labels?: Partial<TableSettingsLabels>;
	onResetSettings?: () => void;
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
	labels,
	onResetSettings,
}: TableSettingsMenuProps<T>) {
	const getColumnLabel = (
		column: ReturnType<Table<T>["getAllLeafColumns"]>[0],
	) => {
		return typeof column.columnDef.header === "string"
			? column.columnDef.header
			: column.id;
	};

	// Get visible columns for column visibility section
	const visibleColumns = table.getAllLeafColumns().filter((column) => {
		const columnDef = column.columnDef as AdaptiveColumnDef<T>;
		const hasVisibilityToggle =
			columnDef.visibilityToggle ?? columnVisibilityToggle;
		return (
			column.getIsVisible() &&
			column.id !== "_actions" &&
			hasVisibilityToggle !== false
		);
	});

	// Get hidden columns
	const hiddenColumns = table.getAllLeafColumns().filter((column) => {
		const columnDef = column.columnDef as AdaptiveColumnDef<T>;
		const hasVisibilityToggle =
			columnDef.visibilityToggle ?? columnVisibilityToggle;
		return (
			!column.getIsVisible() &&
			column.id !== "_actions" &&
			hasVisibilityToggle !== false
		);
	});

	// Get sortable columns
	const sortableColumns = table.getAllLeafColumns().filter((column) => {
		const columnDef = column.columnDef as AdaptiveColumnDef<T>;
		const isSortable = columnDef.sortable ?? sortable;
		return column.id !== "_actions" && isSortable;
	});

	// Get groupable columns
	const groupableColumns = table
		.getAllLeafColumns()
		.filter((column) => column.id !== "_actions");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<Settings className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-52" align="end">
				{/* Column Visibility Submenu */}
				{columnVisibilityToggle && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Eye className="h-4 w-4" />
							<span>
								{labels?.columnVisibility ||
									"Column Visibility"}
							</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-56 max-h-80 overflow-y-auto">
							<div className="px-2 py-1">
								<p className="text-xs font-medium text-muted-foreground">
									{labels?.shownInTable || "Shown in table"}
								</p>
							</div>
							{visibleColumns.map((column) => (
								<DropdownMenuItem
									key={column.id}
									className="gap-2 px-2 py-1"
									disabled={!column.getCanHide()}
									onSelect={(e) => {
										e.preventDefault();
										column.toggleVisibility(false);
									}}
								>
									<Checkbox
										checked={true}
										disabled={!column.getCanHide()}
										className="h-3.5 w-3.5"
									/>
									<span className="text-sm truncate flex-1">
										{getColumnLabel(column)}
									</span>
								</DropdownMenuItem>
							))}

							{hiddenColumns.length > 0 && (
								<>
									<DropdownMenuSeparator />
									<div className="px-2 py-1">
										<p className="text-xs font-medium text-muted-foreground">
											{labels?.hidden || "Hidden"}
										</p>
									</div>
									{hiddenColumns.map((column) => (
										<DropdownMenuItem
											key={column.id}
											className="gap-2 px-2 py-1"
											disabled={!column.getCanHide()}
											onSelect={(e) => {
												e.preventDefault();
												column.toggleVisibility(true);
											}}
										>
											<Checkbox
												checked={false}
												disabled={!column.getCanHide()}
												className="h-3.5 w-3.5"
											/>
											<span className="text-sm truncate flex-1 text-muted-foreground">
												{getColumnLabel(column)}
											</span>
										</DropdownMenuItem>
									))}
								</>
							)}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}

				{/* Group By Submenu */}
				{groupable && paginationType !== "server" && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<Group className="h-4 w-4" />
							<span>{labels?.groupBy || "Group By"}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-56 max-h-80 overflow-y-auto">
							{groupBy && (
								<>
									<DropdownMenuItem
										className="gap-2 px-2 py-1 text-destructive"
										onSelect={() => onGroupByChange(null)}
									>
										<X className="h-4 w-4" />
										<span className="text-sm">
											Clear grouping
										</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<div className="px-2 py-1">
								<p className="text-xs font-medium text-muted-foreground">
									{labels?.groupByProperty ||
										"Group by property"}
								</p>
							</div>
							{groupableColumns.map((column) => {
								const isSelected = groupBy === column.id;
								return (
									<DropdownMenuItem
										key={column.id}
										className="gap-2 px-2 py-1"
										onSelect={() =>
											onGroupByChange(column.id)
										}
									>
										<div
											className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
												isSelected
													? "bg-primary border-primary"
													: "border-input"
											}`}
										>
											{isSelected && (
												<Check className="h-2.5 w-2.5 text-primary-foreground" />
											)}
										</div>
										<span
											className={`text-sm truncate flex-1 ${
												isSelected ? "font-medium" : ""
											}`}
										>
											{getColumnLabel(column)}
										</span>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}

				{/* Sort Submenu */}
				{sortable && (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className="gap-2">
							<ArrowUpAZ className="h-4 w-4" />
							<span>{labels?.sort || "Order By"}</span>
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-56 max-h-80 overflow-y-auto">
							{sorting.length > 0 && (
								<>
									<DropdownMenuItem
										className="gap-2 px-2 py-1.5 text-destructive"
										onSelect={() => onSortingChange([])}
									>
										<X className="h-4 w-4" />
										<span className="text-sm">
											Clear all sorting
										</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							{sortableColumns.map((column) => {
								const sortedState = column.getIsSorted();
								return (
									<DropdownMenuSub key={column.id}>
										<DropdownMenuSubTrigger className="gap-2 px-2 py-1.5">
											{sortedState === "asc" ? (
												<ArrowUpAZ className="h-4 w-4 text-primary" />
											) : sortedState === "desc" ? (
												<ArrowDownAZ className="h-4 w-4 text-primary" />
											) : (
												<Minus className="h-4 w-4 text-muted-foreground" />
											)}
											<span
												className={`text-sm truncate flex-1 ${
													sortedState
														? "font-medium"
														: ""
												}`}
											>
												{getColumnLabel(column)}
											</span>
										</DropdownMenuSubTrigger>
										<DropdownMenuSubContent className="w-36">
											<DropdownMenuItem
												className="gap-2 px-2 py-1.5"
												onSelect={() =>
													column.toggleSorting(false)
												}
											>
												<ArrowUpAZ className="h-4 w-4" />
												<span className="text-sm">
													Ascending
												</span>
												{sortedState === "asc" && (
													<Check className="h-4 w-4 ml-auto" />
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												className="gap-2 px-2 py-1.5"
												onSelect={() =>
													column.toggleSorting(true)
												}
											>
												<ArrowDownAZ className="h-4 w-4" />
												<span className="text-sm">
													Descending
												</span>
												{sortedState === "desc" && (
													<Check className="h-4 w-4 ml-auto" />
												)}
											</DropdownMenuItem>
											{sortedState && (
												<>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="gap-2 px-2 py-1.5 text-muted-foreground"
														onSelect={() =>
															column.clearSorting()
														}
													>
														<X className="h-4 w-4" />
														<span className="text-sm">
															Clear
														</span>
													</DropdownMenuItem>
												</>
											)}
										</DropdownMenuSubContent>
									</DropdownMenuSub>
								);
							})}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}

				{/* Reset Settings */}
				{onResetSettings && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2 text-destructive"
							onSelect={() => onResetSettings()}
						>
							<RotateCcw className="h-4 w-4" />
							<span>
								{labels?.resetSettings || "Reset Settings"}
							</span>
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
