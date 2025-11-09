import { Button, Select } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
	currentPage: number;
	perPage: number;
	maxPage: number;
	recordsTotal?: number;
	totalRecords: number;
	loading: boolean;
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number, currentPage: number) => void;
}

export function TablePagination({
	currentPage,
	perPage,
	maxPage,
	recordsTotal,
	totalRecords,
	loading,
	onPageChange,
	onPerPageChange,
}: TablePaginationProps) {
	const startRecord = (currentPage - 1) * perPage + 1;
	const endRecord = Math.min(currentPage * perPage, totalRecords);

	return (
		<div className="flex items-center justify-between mt-4 px-2">
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">
					Rows per page:
				</span>
				<Select
					value={String(perPage)}
					onChange={(value) => {
						const newPerPage = Number.parseInt(value, 10);
						onPerPageChange(newPerPage, 1);
					}}
					options={[
						{ value: "10", label: "10" },
						{ value: "20", label: "20" },
						{ value: "50", label: "50" },
						{ value: "100", label: "100" },
					]}
					classNames={{
						root: "w-[70px]",
						trigger: "h-8",
					}}
				/>
				{recordsTotal !== undefined && (
					<span className="text-sm text-muted-foreground ml-4">
						{startRecord}-{endRecord} of {recordsTotal} records
					</span>
				)}
			</div>
			<div className="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onPageChange(1)}
					disabled={currentPage === 1 || loading}
				>
					<ChevronLeft className="h-4 w-4" />
					<ChevronLeft className="h-4 w-4 -ml-3" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1 || loading}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<span className="text-sm px-4">
					Page {currentPage} of {maxPage}
				</span>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage >= maxPage || loading}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => onPageChange(maxPage)}
					disabled={currentPage >= maxPage || loading}
				>
					<ChevronRight className="h-4 w-4" />
					<ChevronRight className="h-4 w-4 -ml-3" />
				</Button>
			</div>
		</div>
	);
}
