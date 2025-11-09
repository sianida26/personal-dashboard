import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui";
import DetailCell from "./DetailCell";
import type { AdaptiveColumnDef } from "./types";

interface DetailSheetProps<T> {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	columns: AdaptiveColumnDef<T>[];
	data: T[];
	detailRowIndex: number | null;
}

export function DetailSheet<T>({
	open,
	onOpenChange,
	columns,
	data,
	detailRowIndex,
}: DetailSheetProps<T>) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-[400px] sm:w-[540px] p-4">
				<SheetHeader className="mb-4">
					<SheetTitle>Row Details</SheetTitle>
				</SheetHeader>
				<div>
					{detailRowIndex !== null && (
						<table className="w-full">
							<tbody>
								{columns.map((column) => {
									const columnId = column.id as string;
									const row = data[detailRowIndex];
									if (!row) return null;

									// Get the value using accessorKey if available
									let value: unknown;
									if (
										"accessorKey" in column &&
										column.accessorKey
									) {
										value = (
											row as Record<string, unknown>
										)[column.accessorKey as string];
									} else if (
										"accessorFn" in column &&
										column.accessorFn
									) {
										value = column.accessorFn(
											row,
											detailRowIndex,
										);
									} else {
										value = (
											row as Record<string, unknown>
										)[columnId];
									}

									const header =
										typeof column.header === "string"
											? column.header
											: columnId;

									return (
										<tr
											key={columnId}
											className="border-b last:border-b-0"
										>
											<td className="py-2 px-2 font-medium text-sm text-muted-foreground w-1/3">
												{header}
											</td>
											<td className="py-2 px-2 text-sm">
												<DetailCell
													column={column}
													value={value}
													rowIndex={detailRowIndex}
													row={row}
												/>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
