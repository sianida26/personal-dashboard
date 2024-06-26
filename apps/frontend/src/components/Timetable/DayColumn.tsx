import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Event from "./types/Event";

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

type Props<T extends Record<string, unknown> & Event> = {
	day: dayjs.Dayjs;
	startTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	events: T[];
	renderCell?: (date: dayjs.Dayjs) => JSX.Element;
	renderEvent?: (event: T) => JSX.Element;
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
					<div key={i} className="border-t h-20 relative">
						{renderCell ? (
							<div className="w-full h-full relative">
								{renderCell(currentDateTime)}
							</div>
						) : (
							<button className="flex pr-1.5 w-full gap-1 relative hover:bg-gray-100 h-full"></button>
						)}

						{/* Events Container */}
						<div className="absolute w-full h-full top-0 left-0 flex gap-1 pr-1.5 pointer-events-none">
							{events
								.filter((event) => {
									return (
										currentDateTime.isSame(
											event.start,
											"hour"
										) ||
										(currentDateTime.isAfter(event.start) &&
											currentDateTime.isBefore(event.end))
									);
								})
								.map((event, i) =>
									currentDateTime.isSame(
										event.start,
										"hour"
									) ? (
										<div
											key={i}
											className="w-full z-10 relative pointer-events-auto"
											style={{
												minHeight: "min-content",

												// The height is calculated from the duration of the event in minutes, converted to a percentage of an hour,
												// plus an additional number of pixels equivalent to the number of hours in the event duration
												height: `calc(${
													(event.end.diff(
														event.start,
														"minute"
													) *
														100) /
													60
												}% + ${event.end.diff(event.start, "hour")}px)`,

												// The top position is calculated from the start minute of the event, converted to a percentage of an hour
												top: `${(event.start.minute() * 100) / 60}%`,
											}}
										>
											{renderEvent ? (
												renderEvent(event)
											) : (
												<button className="bg-primary-100 rounded-sm text-sm text-left pl-1 text-primary-800 font-medium w-full h-full flex items-start justify-start">
													{event.title}
												</button>
											)}
										</div>
									) : (
										<div className="w-full"></div>
									)
								)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
