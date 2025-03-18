import { type Table as ReactTable, flexRender } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui";
import { cn } from "@repo/ui/utils";

interface Props<TData> {
	table: ReactTable<TData>;
	columnBorders?: boolean;
	onRowClick?: (row: TData) => void;
}

export default function DashboardTable<T>({
	table,
	onRowClick,
	columnBorders = false,
}: Props<T>) {
	return (
		<div
			className={cn("rounded-md border overflow-hidden", {
				relative: table.getState().columnSizingInfo.isResizingColumn,
			})}
		>
			<div
				className={cn({
					"w-fit min-w-full":
						table.getState().columnSizingInfo.isResizingColumn,
				})}
			>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										style={{
											width: header.getSize(),
											position: "relative",
										}}
										className={cn(
											columnBorders &&
												"border-r last:border-r-0",
										)}
									>
										{header.isPlaceholder ? null : (
											<div className="flex items-center">
												{flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
											</div>
										)}
										{header.column.getCanResize() && (
											<div
												onMouseDown={header.getResizeHandler()}
												onTouchStart={header.getResizeHandler()}
												className={cn(
													"absolute top-0 right-0 h-full w-2 cursor-col-resize",
													"opacity-0 hover:opacity-100",
													header.column.getIsResizing() &&
														"opacity-100 bg-primary/10",
												)}
											/>
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row, rowIndex) => (
								<TableRow
									key={row.id}
									className={
										rowIndex % 2 === 0
											? "bg-muted"
											: "bg-background"
									}
									onClick={() => onRowClick?.(row.original)}
									style={{
										cursor: onRowClick
											? "pointer"
											: "default",
									}}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												width: cell.column.getSize(),
											}}
											className={cn(
												columnBorders &&
													"border-r last:border-r-0",
											)}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={table.getAllColumns().length}
								>
									<p className="text-center">- No Data -</p>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
