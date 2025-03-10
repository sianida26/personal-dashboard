import { usePermissions } from "@/hooks/useAuth";
import { DatePickerInput, type DateRange } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_dashboardLayout/dev")({
	component: RouteComponent,
});

// TODO: Make this page inacessible

function RouteComponent() {
	usePermissions("dev-routes");

	const [selectedRangeValue, setSelectedRangeValue] = useState<DateRange>({
		from: new Date(),
		to: null,
	});

	return (
		<DatePickerInput
			allowDeselect={true}
			mode="range"
			value={selectedRangeValue}
			onChange={(value: DateRange) => {
				setSelectedRangeValue(value);
			}}
		/>
	);
}
