import dayjs, { type Dayjs } from "dayjs";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { Button } from "../../../../../packages/ui/src/components/button";
import DayColumn from "./DayColumn";
import HourColumn from "./HourColumn";
import WeekPicker from "./WeekPicker";
import type Event from "./types/Event";

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

type Props<T extends Record<string, unknown> & Event> = {
	startTime?: dayjs.Dayjs;
	endTime?: dayjs.Dayjs;
	events: T[];
	renderCell?: (date: dayjs.Dayjs) => ReactNode;
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

export default function Timetable<T extends Record<string, unknown> & Event>({
	events,
	classNames,
	...props
}: Props<T>) {
	const [currentDate, setCurrentDate] = useState(dayjs());

	const startTime = props.startTime ?? dayjs("08:00", "HH:mm");
	const endTime = props.endTime ?? dayjs("18:00", "HH:mm");

	const weekDays = useMemo(() => {
		const startOfWeek = currentDate.startOf("isoWeek");

		return [...new Array(7)].map((_, i) => startOfWeek.add(i, "day"));
	}, [currentDate]);

	const eventPerDay = useMemo(() => {
		const startOfWeek = currentDate.startOf("isoWeek");

		return [...new Array(7)].map((_, i) => {
			const currentDateIteration = startOfWeek.add(i, "day");

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
				<div className="">
					{props.header?.center && props.header.center}
				</div>

				{/* Right */}
				<div className="">
					{props.header?.right && props.header.right}
				</div>
			</div>
			{/* The Table */}
			<div className="flex">
				{/* Columns */}
				<HourColumn startTime={startTime} endTime={endTime} />
				{weekDays.map((day, i) => (
					<DayColumn
						key={day.format()}
						day={day}
						events={eventPerDay[i]}
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
