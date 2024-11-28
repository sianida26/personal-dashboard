import Timetable from "@/components/Timetable";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";

export const Route = createFileRoute("/_dashboardLayout/timetable/")({
	component: TimetablePage,
});

const events = [
	{
		title: "Hehe 1",
		start: dayjs("24 June 2024 09:00", "DD MMMM YYYY HH:mm"),
		end: dayjs("24 June 2024 11:45", "DD MMMM YYYY HH:mm"),
	},
	{
		title: "Hehe 2",
		start: dayjs("24 June 2024 09:30", "DD MMMM YYYY HH:mm"),
		end: dayjs("24 June 2024 10:00", "DD MMMM YYYY HH:mm"),
	},
	{
		title: "Hehe 3",
		start: dayjs("24 June 2024 10:30", "DD MMMM YYYY HH:mm"),
		end: dayjs("24 June 2024 11:00", "DD MMMM YYYY HH:mm"),
	},
];

export default function TimetablePage() {
	console.log(events);

	return (
		<div>
			<Timetable events={events} />
		</div>
	);
}
