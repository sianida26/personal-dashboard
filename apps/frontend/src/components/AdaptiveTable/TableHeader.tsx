import { Badge, Button } from "@repo/ui";
import type { SortingState, Table } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { TableSettingsMenu } from "./TableSettingsMenu";

interface TableHeaderProps<T> {
	title?: string;
	showHeader: boolean;
	rowSelectable: boolean;
	rowSelection: Record<string, boolean>;
	table: Table<T>;
	selectActions?: Array<{ name: string; button: ReactNode }>;
	onSelectAction?: (rows: T[], actionName: string) => void;
	columnVisibilityToggle: boolean;
	groupable: boolean;
	groupBy: string | null;
	onGroupByChange: (groupBy: string | null) => void;
	paginationType: "client" | "server";
	sortable: boolean;
	sorting: SortingState;
	onSortingChange: (sorting: SortingState) => void;
	headerActions?: ReactNode;
}

export function TableHeader<T>({
	title,
	showHeader,
	rowSelectable,
	rowSelection,
	table,
	selectActions,
	onSelectAction,
	columnVisibilityToggle,
	groupable,
	groupBy,
	onGroupByChange,
	paginationType,
	sortable,
	sorting,
	onSortingChange,
	headerActions,
}: TableHeaderProps<T>) {
	if (!showHeader) return null;

	const selectedRowsCount = rowSelectable
		? Object.keys(rowSelection).length
		: 0;
	const selectedRows = rowSelectable
		? table.getSelectedRowModel().rows.map((row) => row.original)
		: [];

	return (
		<div className="flex items-center justify-between mb-4">
			<div className="flex items-center gap-2">
				{title && <h2 className="text-lg font-semibold">{title}</h2>}
				{rowSelectable && selectedRowsCount > 0 && (
					<>
						<Badge variant="secondary">
							{selectedRowsCount} selected
						</Badge>
						{selectActions?.map((action) => (
							<button
								key={action.name}
								type="button"
								onClick={() => {
									if (onSelectAction) {
										onSelectAction(
											selectedRows,
											action.name,
										);
									}
								}}
							>
								{action.button}
							</button>
						))}
					</>
				)}
			</div>
			<div className="flex items-center gap-2">
				{columnVisibilityToggle && (
					<TableSettingsMenu
						table={table}
						columnVisibilityToggle={columnVisibilityToggle}
						groupable={groupable}
						groupBy={groupBy}
						onGroupByChange={onGroupByChange}
						paginationType={paginationType}
						sortable={sortable}
						sorting={sorting}
						onSortingChange={onSortingChange}
					/>
				)}
				{headerActions ? headerActions : <Button size="sm">New</Button>}
			</div>
		</div>
	);
}
