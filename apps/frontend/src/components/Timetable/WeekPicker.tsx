import { Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import dayjs from "dayjs";
import { useState } from "react";

interface Props {
	currentDate: dayjs.Dayjs;
	onChange: (date: Date) => void;
}

function getDay(date: Date) {
	const day = date.getDay();
	return day === 0 ? 6 : day - 1;
}

function startOfWeek(date: Date) {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate() - getDay(date) - 1
	);
}

function endOfWeek(date: Date) {
	return dayjs(
		new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate() + (6 - getDay(date))
		)
	)
		.endOf("date")
		.toDate();
}

function isInWeekRange(date: Date, value: Date | null) {
	return value
		? dayjs(date).isBefore(endOfWeek(value)) &&
				dayjs(date).isAfter(startOfWeek(value))
		: false;
}

export default function WeekPicker({ currentDate, onChange }: Props) {
	const [hovered, setHovered] = useState<Date | null>(null);
	const [value, setValue] = useState<Date | null>(null);

	return (
		<Popover>
			<Popover.Target>
				<button>{currentDate.format("MMMM YYYY")}</button>
			</Popover.Target>
			<Popover.Dropdown>
				<DatePicker
					getDayProps={(date) => {
						const isHovered = isInWeekRange(date, hovered);
						const isSelected = isInWeekRange(date, value);
						const isInRange = isHovered || isSelected;
						return {
							onMouseEnter: () => setHovered(date),
							onMouseLeave: () => setHovered(null),
							inRange: isInRange,
							firstInRange: isInRange && date.getDay() === 1,
							lastInRange: isInRange && date.getDay() === 0,
							selected: isSelected,
							onClick: () => setValue(date),
						};
					}}
					onChange={(date) => onChange(date ?? new Date())}
				/>
			</Popover.Dropdown>
		</Popover>
	);
}
