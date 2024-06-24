import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Event from "./types/Event";

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

type Props = {
	day: dayjs.Dayjs;
	startTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	events: Event[];
	renderCell?: (events: Event[]) => JSX.Element;
};

export default function DayColumn({
	day,
	startTime,
	endTime,
	events,
	renderCell,
}: Props) {
	const isToday = day.isSame(dayjs(), "day");

	return (
		<div className="basis-[14.3%] flex flex-col border-r border-t border-b border-gray-100">
			{/* Column Header */}
			<div className="flex flex-col h-20 p-2 relative">
				{isToday && (
					<div className="w-full h-1 bg-primary-500 top-0 left-0 absolute" />
				)}
				<p className="text-2xl font-bold">{day.date()}</p>
				<p>{day.format("dddd")}</p>
			</div>

			{/* Hour rows */}
			{[...new Array(endTime.diff(startTime, "h"))].map((_, i) => {
				const currentDateTime = day.hour(startTime.hour() + i);

				return (
					// Base Cell
					<div key={i} className="border-t h-20">
						{renderCell ? (
							<div className="w-full h-full relative">
								{renderCell(
									events.filter((event) => {
										// return event.start.isSame(
										// 	startTime.add(i, "h"),
										// 	"hour"
										// );

										return (
											currentDateTime.isSame(
												event.start,
												"hour"
											) ||
											(currentDateTime.isAfter(
												event.start
											) &&
												currentDateTime.isBefore(
													event.end
												))
										);
									})
								)}
							</div>
						) : (
							<div className="flex pr-1.5 w-full gap-1 relative hover:bg-gray-100 h-full">
								{events
									.filter((event) => {
										return (
											currentDateTime.isSame(
												event.start,
												"hour"
											) ||
											(currentDateTime.isAfter(
												event.start
											) &&
												currentDateTime.isBefore(
													event.end
												))
										);
									})
									.map((event, i) =>
										currentDateTime.isSame(
											event.start,
											"hour"
										) ? (
											<div
												key={i}
												className="bg-primary-100 rounded-sm text-sm text-left pl-1 text-primary-800 font-medium w-full z-10 relative"
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
												{event.title}
											</div>
										) : (
											<div className="w-full"></div>
										)
									)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
