import dayjs from "dayjs";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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
		date.getDate() - getDay(date),
	);
}

function endOfWeek(date: Date) {
	return dayjs(
		new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate() + (6 - getDay(date)),
		),
	)
		.endOf("date")
		.toDate();
}

export default function WeekPicker({ currentDate, onChange }: Props) {
	return (
		<Popover>
			<PopoverTrigger>
				<button type="button">{currentDate.format("MMMM YYYY")}</button>
			</PopoverTrigger>
			<PopoverContent>
				<Calendar
					mode="range"
					weekStartsOn={1}
					selected={{
						from: startOfWeek(currentDate.toDate()),
						to: endOfWeek(currentDate.toDate()),
					}}
					onDayClick={(date) => {
						onChange(startOfWeek(date ?? new Date()));
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
