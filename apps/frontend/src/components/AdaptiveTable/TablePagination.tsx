import { Button, Input, Select } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface TablePaginationProps {
	currentPage: number;
	perPage: number;
	maxPage: number;
	recordsTotal?: number;
	totalRecords: number;
	loading: boolean;
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number, currentPage: number) => void;
	pageSizeOptions?: number[];
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
	pageSizeOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
	const startRecord = (currentPage - 1) * perPage + 1;
	const endRecord = Math.min(currentPage * perPage, totalRecords);
	const [customValue, setCustomValue] = useState("");
	const [showCustomInput, setShowCustomInput] = useState(false);

	// Check if current perPage is in the options
	const isCustomPerPage = !pageSizeOptions.includes(perPage);

	const handleCustomInputSubmit = () => {
		const value = Number.parseInt(customValue, 10);
		if (value > 0 && value <= 10000) {
			onPerPageChange(value, 1);
			setCustomValue("");
			setShowCustomInput(false);
		}
	};

	const handleCustomInputKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Enter") {
			handleCustomInputSubmit();
		} else if (e.key === "Escape") {
			setCustomValue("");
			setShowCustomInput(false);
		}
	};

	return (
		<div className="flex items-center justify-between mt-4 px-2">
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">
					Rows per page:
				</span>
				{showCustomInput ? (
					<div className="flex items-center gap-1">
						<Input
							type="number"
							value={customValue}
							onChange={(e) => setCustomValue(e.target.value)}
							onKeyDown={handleCustomInputKeyDown}
							placeholder="Enter rows"
							className="h-8 w-24"
							min={1}
							max={10000}
							autoFocus
							onBlur={() => {
								setTimeout(() => {
									setShowCustomInput(false);
									setCustomValue("");
								}, 200);
							}}
						/>
						<Button
							variant="outline"
							size="sm"
							className="h-8"
							onClick={handleCustomInputSubmit}
						>
							OK
						</Button>
					</div>
				) : (
					<Select
						value={String(perPage)}
						onChange={(value) => {
							if (value === "custom") {
								setShowCustomInput(true);
							} else {
								const newPerPage = Number.parseInt(value, 10);
								onPerPageChange(newPerPage, 1);
							}
						}}
						options={[
							...pageSizeOptions.map((size) => ({
								value: String(size),
								label: String(size),
							})),
							...(isCustomPerPage
								? [
										{
											value: String(perPage),
											label: String(perPage),
										},
									]
								: []),
							{ value: "custom", label: "Custom..." },
						]}
						classNames={{
							root: "w-[90px]",
							trigger: "h-8",
						}}
					/>
				)}
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
