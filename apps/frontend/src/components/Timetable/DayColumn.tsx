import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import type Event from "./types/Event";
import type { ReactNode } from "react";

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

type Props<T extends Record<string, unknown> & Event> = {
	day: dayjs.Dayjs;
	startTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	events: T[];
	renderCell?: (date: dayjs.Dayjs) => ReactNode;
	renderEvent?: (event: T) => ReactNode;
};

export default function DayColumn<T extends Record<string, unknown> & Event>({
	day,
	startTime,
	endTime,
	events,
	renderCell,
	renderEvent,
}: Props<T>) {
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
										currentDateTime.isSame(event.start, "hour") ||
										(currentDateTime.isAfter(event.start) &&
											currentDateTime.isBefore(event.end))
									);
								})
								.map((event, i) =>
									currentDateTime.isSame(event.start, "hour") ? (
										<div
											key={`${event.title}-${event.start.valueOf()}`}
											className="w-full z-10 relative pointer-events-auto"
											style={{
												minHeight: "min-content",

												// The height is calculated from the duration of the event in minutes, converted to a percentage of an hour,
												// plus an additional number of pixels equivalent to the number of hours in the event duration
												height: `calc(${
													(event.end.diff(event.start, "minute") * 100) / 60
												}% + ${event.end.diff(event.start, "hour")}px)`,

												// The top position is calculated from the start minute of the event, converted to a percentage of an hour
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
