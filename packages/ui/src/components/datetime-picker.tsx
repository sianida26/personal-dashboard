"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "../utils";
import { Calendar } from "./calendar";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Label } from "./label";

export interface DateTimePickerProps {
	value?: Date;
	onChange?: (date: Date) => void;
	error?: React.ReactNode;
	label?: string;
	withAsterisk?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
}

export function DateTimePicker({
	value,
	onChange,
	error,
	label,
	withAsterisk,
	disabled,
	readOnly,
}: DateTimePickerProps) {
	// Controlled vs. uncontrolled state
	const [internalDate, setInternalDate] = React.useState<Date | undefined>(
		value,
	);
	const date = value !== undefined ? value : internalDate;
	const [isOpen, setIsOpen] = React.useState(false);

	React.useEffect(() => {
		if (value !== undefined) {
			setInternalDate(value);
		}
	}, [value]);

	const hours = Array.from({ length: 24 }, (_, i) => i);
	// const handleDateSelect = (selectedDate: Date | undefined) => {
	// 	if (selectedDate && !disabled && !readOnly) {
	// 		if (onChange) {
	// 			onChange(selectedDate);
	// 		} else {
	// 			setInternalDate(selectedDate);
	// 		}
	// 	}
	// };

	const handleTimeChange = (type: "hour" | "minute", value: string) => {
		if (date && !disabled && !readOnly) {
			const newDate = new Date(date);
			if (type === "hour") {
				newDate.setHours(Number.parseInt(value));
			} else if (type === "minute") {
				newDate.setMinutes(Number.parseInt(value));
			}
			if (onChange) {
				onChange(newDate);
			} else {
				setInternalDate(newDate);
			}
		}
	};

	return (
		<div>
			{label && (
				<span>
					<Label>{label}</Label>
					{withAsterisk && <span className="text-red-500">*</span>}
				</span>
			)}
			<Popover
				open={isOpen}
				onOpenChange={(open) => {
					if (!disabled && !readOnly) setIsOpen(open);
				}}
			>
				<PopoverTrigger asChild>
					<Button
						id="datetime-picker"
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full justify-start text-left font-normal",
							!date && "text-muted-foreground",
							(disabled || readOnly) &&
								"opacity-50 cursor-not-allowed",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date ? (
							format(date, "MM/dd/yyyy HH:mm")
						) : (
							<span>MM/DD/YYYY HH:mm</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<div className="sm:flex">
						<Calendar />
						<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex sm:flex-col p-2">
									{hours.reverse().map((hour) => (
										<Button
											key={hour}
											size="icon"
											variant={
												date && date.getHours() === hour
													? "default"
													: "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() =>
												handleTimeChange(
													"hour",
													hour.toString(),
												)
											}
										>
											{hour}
										</Button>
									))}
								</div>
								<ScrollBar
									orientation="horizontal"
									className="sm:hidden"
								/>
							</ScrollArea>
							<ScrollArea className="w-64 sm:w-auto">
								<div className="flex sm:flex-col p-2">
									{Array.from(
										{ length: 12 },
										(_, i) => i * 5,
									).map((minute) => (
										<Button
											key={minute}
											size="icon"
											variant={
												date &&
												date.getMinutes() === minute
													? "default"
													: "ghost"
											}
											className="sm:w-full shrink-0 aspect-square"
											onClick={() =>
												handleTimeChange(
													"minute",
													minute.toString(),
												)
											}
										>
											{minute.toString().padStart(2, "0")}
										</Button>
									))}
								</div>
								<ScrollBar
									orientation="horizontal"
									className="sm:hidden"
								/>
							</ScrollArea>
						</div>
					</div>
				</PopoverContent>
			</Popover>
			{error && <small className="text-red-500">{error}</small>}
		</div>
	);
}
