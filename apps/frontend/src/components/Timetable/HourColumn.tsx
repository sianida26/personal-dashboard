import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import { useMemo } from "react";

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

type Props = {
	startTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
};

export default function HourColumn({ startTime, endTime }: Props) {
	const hoursArray = useMemo(() => {
		const arr: dayjs.Dayjs[] = [];
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
