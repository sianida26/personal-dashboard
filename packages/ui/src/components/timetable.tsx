import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Extend dayjs with necessary plugins
dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

/**
 * Event type representing an event with a title, start and end time.
 */
export type Event = {
	title: string;
	start: Dayjs;
	end: Dayjs;
};

/**
 * Props for DayColumn component.
 */
type DayColumnProps<T extends Record<string, unknown> & Event> = {
	day: Dayjs;
	startTime: Dayjs;
	endTime: Dayjs;
	events: T[];
	renderCell?: (date: Dayjs) => ReactNode;
	renderEvent?: (event: T) => ReactNode;
};

/**
 * DayColumn component renders a column for a day in the timetable.
 */
function DayColumn<T extends Record<string, unknown> & Event>({
	day,
	startTime,
	endTime,
	events,
	renderCell,
	renderEvent,
}: DayColumnProps<T>) {
	const isToday = day.isSame(dayjs(), "day");

	return (
		<div className="basis-[14.3%] flex flex-col border-r border-t border-b border-gray-100">
			{/* Column Header */}
			<div className="flex flex-col h-20 p-2 relative">
				{isToday && (
					<div className="w-full h-1 bg-primary-500 top-0 left-0 absolute rounded-t-lg" />
				)}
				<p className="text-2xl font-bold">{day.date()}</p>
				<p>{day.format("dddd")}</p>
			</div>

			{/* Hour rows */}
			{[...new Array(endTime.diff(startTime, "h"))].map((_, i) => {
				const currentDateTime = day.hour(startTime.hour() + i);

				return (
					// Base Cell
					<div
						key={currentDateTime.format("YYYY-MM-DD-HH")}
						className="border-t h-20 relative"
					>
						{renderCell ? (
							<div className="w-full h-full relative">
								{renderCell(currentDateTime)}
							</div>
						) : (
							<button
								type="button"
								className="flex pr-1.5 w-full gap-1 relative hover:bg-gray-100 h-full"
							/>
						)}

						{/* Events Container */}
						<div className="absolute w-full h-full top-0 left-0 flex gap-1 pr-1.5 pointer-events-none">
							{events
								.filter((event) => {
									return (
										currentDateTime.isSame(
											event.start,
											"hour",
										) ||
										(currentDateTime.isAfter(event.start) &&
											currentDateTime.isBefore(event.end))
									);
								})
								.map((event, i) =>
									currentDateTime.isSame(
										event.start,
										"hour",
									) ? (
										<div
											key={`${event.title}-${event.start.valueOf()}`}
											className="w-full z-10 relative pointer-events-auto"
											style={{
												minHeight: "min-content",
												// Calculate event height based on duration
												height: `calc(${
													(event.end.diff(
														event.start,
														"minute",
													) *
														100) /
													60
												}% + ${event.end.diff(event.start, "hour")}px)`,
												// Position event at proper top offset
												top: `${(event.start.minute() * 100) / 60}%`,
											}}
										>
											{renderEvent ? (
												renderEvent(event)
											) : (
												<button
													type="button"
													className="bg-primary-100 rounded-sm text-sm text-left pl-1 text-primary-800 font-medium w-full h-full flex items-start justify-start"
												>
													{event.title}
												</button>
											)}
										</div>
									) : (
										<div
											key={`${event.title}-${event.start.valueOf()}-${i}`}
											className="w-full"
										/>
									),
								)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

/**
 * Props for HourColumn component.
 */
type HourColumnProps = {
	startTime: Dayjs;
	endTime: Dayjs;
};

/**
 * HourColumn component renders the column displaying hour labels.
 */
function HourColumn({ startTime, endTime }: HourColumnProps) {
	const hoursArray = useMemo(() => {
		const arr: Dayjs[] = [];
		let currentTime = startTime;

		while (currentTime.isBefore(endTime)) {
			arr.push(currentTime);
			currentTime = currentTime.add(1, "hour");
		}

		return arr;
	}, [startTime, endTime]);

	return (
		<div className="flex flex-col border w-12">
			{/* Column Header */}
			<div className="flex flex-col h-20" />

			{/* Hour Rows */}
			{hoursArray.map((h) => (
				<div
					key={h.format("HH:mm")}
					className="border-t h-20 flex items-center justify-center font-medium text-xs text-gray-500"
				>
					{h.format("hA").toLowerCase()}
				</div>
			))}
		</div>
	);
}

/**
 * Props for WeekPicker component.
 */
interface WeekPickerProps {
	currentDate: Dayjs;
	onChange: (date: Date) => void;
}

/**
 * WeekPicker component renders a calendar popover for selecting weeks.
 */
function WeekPicker({ currentDate, onChange }: WeekPickerProps) {
	return (
		<Popover>
			<PopoverTrigger>
				<button type="button">{currentDate.format("MMMM YYYY")}</button>
			</PopoverTrigger>
			<PopoverContent>
				<Calendar
					date={currentDate.toDate()}
					onDateChange={(date) => onChange(date)}
				/>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Props for the Timetable component.
 */
type TimetableProps<T extends Record<string, unknown> & Event> = {
	startTime?: Dayjs;
	endTime?: Dayjs;
	events: T[];
	renderCell?: (date: Dayjs) => ReactNode;
	renderEvent?: (event: T) => ReactNode;
	onDateChange?: (date: Dayjs) => void;
	header?: {
		center?: ReactNode;
		right?: ReactNode;
	};
	classNames?: Partial<{
		todayButton: string;
	}>;
};

/**
 * Timetable component renders a weekly timetable with time columns and day columns.
 */
export default function Timetable<T extends Record<string, unknown> & Event>({
	events,
	classNames,
	...props
}: TimetableProps<T>) {
	const [currentDate, setCurrentDate] = useState(dayjs());

	const startTime = props.startTime ?? dayjs("08:00", "HH:mm");
	const endTime = props.endTime ?? dayjs("18:00", "HH:mm");

	const weekDays = useMemo(() => {
		const startOfWeekDate = currentDate.startOf("isoWeek");
		return [...new Array(7)].map((_, i) => startOfWeekDate.add(i, "day"));
	}, [currentDate]);

	const eventPerDay = useMemo(() => {
		const startOfWeekDate = currentDate.startOf("isoWeek");
		return [...new Array(7)].map((_, i) => {
			const currentDateIteration = startOfWeekDate.add(i, "day");
			return events.filter((event) => {
				return (
					event.start.isSame(currentDateIteration, "day") ||
					event.end.isSame(currentDateIteration, "day")
				);
			});
		});
	}, [currentDate, events]);

	useEffect(() => {
		props.onDateChange?.(currentDate);
	}, [currentDate, props]);

	return (
		<div className="w-full h-full flex flex-col gap-4">
			{/* Header */}
			<div className="flex justify-between items-center">
				{/* Left */}
				<div className="flex gap-8 items-center">
					<Button
						className={classNames?.todayButton}
						onClick={() => setCurrentDate(dayjs())}
					>
						Today
					</Button>
					<div className="flex gap-2">
						<Button
							variant="ghost"
							onClick={() =>
								setCurrentDate(currentDate.subtract(1, "week"))
							}
						>
							<TbChevronLeft />
						</Button>
						<Button
							variant="ghost"
							onClick={() =>
								setCurrentDate(currentDate.add(1, "week"))
							}
						>
							<TbChevronRight />
						</Button>
					</div>
					<WeekPicker
						currentDate={currentDate}
						onChange={(date) => setCurrentDate(dayjs(date))}
					/>
				</div>
				{/* Center */}
				<div>{props.header?.center}</div>
				{/* Right */}
				<div>{props.header?.right}</div>
			</div>
			{/* The Table */}
			<div className="flex">
				<HourColumn startTime={startTime} endTime={endTime} />
				{weekDays.map((day, i) => (
					<DayColumn
						key={day.format()}
						day={day}
						events={eventPerDay[i] || []}
						startTime={startTime}
						endTime={endTime}
						renderCell={props.renderCell}
						renderEvent={props.renderEvent}
					/>
				))}
			</div>
		</div>
	);
}
