"use client";

import * as React from "react";
import { CalendarIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "../utils";
import { Calendar } from "./calendar";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Label } from "./label";

export interface DateTimePickerClassNames {
	root: string;
	label: string;
	button: string;
	popoverContent: string;
	calendar: string;
	timeScrollerHour: string;
	timeScrollerMinute: string;
}

export interface DateTimePickerProps {
	value?: Date;
	onChange?: (date: Date) => void;
	error?: React.ReactNode;
	label?: string;
	withAsterisk?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	id?: string;
	className?: string;
	classNames?: Partial<DateTimePickerClassNames>;
}

export function DateTimePicker({
	value,
	onChange,
	error,
	label,
	withAsterisk,
	disabled,
	readOnly,
	id,
	className,
	classNames,
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
		<div className={cn(className, classNames?.root)} id={id}>
			{label && (
				<span className={cn(classNames?.label)}>
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
							classNames?.button,
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{date ? (
							dayjs(date).format("MM/DD/YYYY HH:mm")
						) : (
							<span>MM/DD/YYYY HH:mm</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className={cn("w-auto p-0", classNames?.popoverContent)}
				>
					<div className="sm:flex">
						<Calendar className={cn(classNames?.calendar)} />
						<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
							<ScrollArea
								className={cn(
									"w-64 sm:w-auto",
									classNames?.timeScrollerHour,
								)}
							>
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
							<ScrollArea
								className={cn(
									"w-64 sm:w-auto",
									classNames?.timeScrollerMinute,
								)}
							>
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
