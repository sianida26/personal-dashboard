import type React from "react";
import { useState } from "react";

type CalendarLevel = "decade" | "year" | "month";

export interface DayProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	static?: boolean;
	date: Date;
	outside?: boolean;
	selected?: boolean;
	hidden?: boolean;
	inRange?: boolean;
	firstInRange?: boolean;
	lastInRange?: boolean;
	renderDay?: (date: Date) => React.ReactNode;
	highlightToday?: boolean;
	disabled?: boolean;
}

export const Day: React.FC<DayProps> = ({
	static: isStatic,
	date,
	outside,
	selected,
	hidden,
	inRange,
	firstInRange,
	lastInRange,
	renderDay,
	highlightToday,
	disabled,
	onClick,
	className = "",
	...rest
}) => {
	if (hidden) return null;

	const today = new Date();
	const isToday = date.toDateString() === today.toDateString();
	let baseClass = "h-8 w-8 m-0.5 text-sm rounded ";

	if (disabled) {
		baseClass += "bg-gray-100 text-gray-400 cursor-not-allowed";
	} else if (selected) {
		baseClass += "bg-primary text-white";
		if (highlightToday && isToday) {
			baseClass += " ring-2 ring-primary-500 ring-offset-1";
		}
	} else if (firstInRange) {
		baseClass += "bg-primary/70 text-white rounded-l-full";
	} else if (lastInRange) {
		baseClass += "bg-primary/70 text-white rounded-r-full";
	} else if (inRange) {
		baseClass += "bg-primary/30 hover:bg-primary/40";
	} else if (highlightToday && isToday) {
		baseClass += "bg-primary/20 font-bold";
	} else if (outside) {
		baseClass += "text-gray-400 hover:bg-blue-50";
	} else {
		baseClass += "hover:bg-blue-100";
	}

	return (
		<button
			type="button"
			onClick={!disabled && !isStatic ? onClick : undefined}
			className={`${baseClass} ${className}`}
			disabled={disabled}
			{...rest}
		>
			{renderDay ? renderDay(date) : date.getDate()}
		</button>
	);
};

export interface CalendarProps {
	// Core props
	date?: Date;
	defaultDate?: Date;
	defaultLevel?: CalendarLevel;
	level?: CalendarLevel;

	// Display / Navigation
	firstDayOfWeek?: number; // 0=Sunday..6=Saturday
	hideOutsideDates?: boolean;
	hideWeekdays?: boolean;
	highlightToday?: boolean;
	locale?: string;
	maxDate?: Date;
	maxLevel?: CalendarLevel;
	minDate?: Date;
	minLevel?: CalendarLevel;
	monthLabelFormat?: string | ((month: Date) => React.ReactNode);
	monthsListFormat?: string;
	static?: boolean;

	// Icons / Labels
	nextIcon?: React.ReactNode;
	prevIcon?: React.ReactNode;
	nextLabel?: string;

	// Callbacks
	excludeDate?: (date: Date) => boolean;
	getDayProps?: (date: Date) => React.HTMLAttributes<HTMLButtonElement>;
	getMonthControlProps?: (
		month: Date,
	) => React.HTMLAttributes<HTMLButtonElement>;
	getYearControlProps?: (
		year: Date,
	) => React.HTMLAttributes<HTMLButtonElement>;
	hasNextLevel?: boolean;
	onDateChange?: (date: Date) => void;
	onLevelChange?: (level: CalendarLevel) => void;
	onMonthMouseEnter?: (month: Date) => void;
	onMonthSelect?: (month: Date) => void;
	onNextDecade?: () => void;
	onNextMonth?: () => void;
	onNextYear?: () => void;
	onPrevDecade?: () => void;
	onPrevMonth?: () => void;
	onPrevYear?: () => void;
	onYearSelect?: (year: Date) => void;
	renderDay?: (date: Date) => React.ReactNode;
	selected?: Date | null;
	className?: string;
}

// Add this type to properly type the Calendar component with the Day property
interface CalendarComponent extends React.FC<CalendarProps> {
	Day: React.FC<DayProps>;
}

export const Calendar = Object.assign(
	function Calendar(props: CalendarProps) {
		// all the existing implementation...
		const {
			date,
			defaultDate,
			defaultLevel = "month",
			level,
			firstDayOfWeek = 1,
			hideOutsideDates = false,
			hideWeekdays,
			highlightToday = false,
			locale = "default",
			maxDate,
			// maxLevel,
			minDate,
			// minLevel,
			monthLabelFormat,
			monthsListFormat,
			static: isStatic,
			nextIcon,
			prevIcon,
			nextLabel,
			excludeDate,
			getDayProps,
			getMonthControlProps,
			getYearControlProps,
			// hasNextLevel,
			onDateChange,
			onLevelChange,
			onMonthMouseEnter,
			onMonthSelect,
			onNextDecade,
			onNextMonth,
			onNextYear,
			onPrevDecade,
			onPrevMonth,
			onPrevYear,
			onYearSelect,
			renderDay,
			selected,
			className,
		} = props;

		// Controlled vs. Uncontrolled
		const [internalDate, setInternalDate] = useState(
			defaultDate ?? new Date(),
		);
		const [internalLevel, setInternalLevel] =
			useState<CalendarLevel>(defaultLevel);

		const displayedDate = date ?? internalDate;
		const currentLevel = level ?? internalLevel;

		const setDate = (newDate: Date) => {
			if (!date) setInternalDate(newDate);
			onDateChange?.(newDate);
		};

		const setLevel = (newLevel: CalendarLevel) => {
			if (!level) setInternalLevel(newLevel);
			onLevelChange?.(newLevel);
		};

		const addMonths = (base: Date, count: number) => {
			const d = new Date(base);
			d.setMonth(d.getMonth() + count);
			return d;
		};

		const addYears = (base: Date, count: number) => {
			const d = new Date(base);
			d.setFullYear(d.getFullYear() + count);
			return d;
		};

		const generateMonthMatrix = (monthDate: Date) => {
			const startOfMonth = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth(),
				1,
			);
			const offset = (startOfMonth.getDay() - firstDayOfWeek + 7) % 7;
			const startOfCalendar = new Date(startOfMonth);
			startOfCalendar.setDate(startOfMonth.getDate() - offset);

			const weeks: Date[][] = [];
			const currentDay = new Date(startOfCalendar);
			for (let w = 0; w < 6; w++) {
				const week: Date[] = [];
				for (let d = 0; d < 7; d++) {
					week.push(new Date(currentDay));
					currentDay.setDate(currentDay.getDate() + 1);
				}
				weeks.push(week);
			}
			return weeks;
		};

		const generateYearMatrix = (yearDate: Date) => {
			return Array.from(
				{ length: 12 },
				(_, i) => new Date(yearDate.getFullYear(), i, 1),
			);
		};

		const generateDecadeRange = (centerYear: number) => {
			const start = centerYear - 5;
			return Array.from(
				{ length: 12 },
				(_, i) => new Date(start + i, 0, 1),
			);
		};

		const isDisabledDay = (d: Date) => {
			if (Number.isNaN(d.getTime())) return true;
			if (excludeDate?.(d)) return true;
			if (minDate && d < minDate) return true;
			if (maxDate && d > maxDate) return true;
			return false;
		};

		const renderMonthLevel = () => {
			const weeks = generateMonthMatrix(displayedDate);
			// Use the selected prop for selection state if provided
			const selectedDate =
				typeof selected !== "undefined"
					? selected
					: date || internalDate;

			return (
				<div className="space-y-2">
					{!hideWeekdays && (
						<div className="grid grid-cols-7 text-center font-semibold">
							{Array.from({ length: 7 }).map((_, i) => {
								const wDay = (firstDayOfWeek + i) % 7;
								const label = new Date(2021, 5, 20 + wDay)
									.toLocaleDateString(locale, {
										weekday: "short",
									})
									.slice(0, 2);
								return <div key={wDay}>{label}</div>;
							})}
						</div>
					)}
					<div className="space-y-1">
						{weeks.map((week) => {
							const weekKey = week
								.map((day) => day.getTime())
								.join("-");
							return (
								<div key={weekKey} className="grid grid-cols-7">
									{week.map((day, di) => {
										const isPlaceholder = Number.isNaN(
											day.getTime(),
										);
										const isOutside =
											day.getMonth() !==
												displayedDate.getMonth() ||
											day.getFullYear() !==
												displayedDate.getFullYear();
										if (hideOutsideDates && isOutside) {
											// Use the right method for avoiding array index as key
											return (
												<div
													key={`outside-${day.getTime()}`}
												/>
											);
										}
										const disabled =
											isPlaceholder || isDisabledDay(day);
										const isSelected = selectedDate
											? day.toDateString() ===
												selectedDate.toDateString()
											: false;

										const dayProps =
											getDayProps?.(day) || {};

										return (
											<Day
												key={
													isPlaceholder
														? `placeholder-${di}`
														: day.getTime()
												}
												date={day}
												static={isStatic}
												outside={isOutside}
												selected={isSelected}
												hidden={false}
												inRange={false}
												firstInRange={false}
												lastInRange={false}
												renderDay={renderDay}
												highlightToday={highlightToday}
												disabled={disabled}
												onClick={() => {
													if (
														!disabled &&
														!isStatic
													) {
														setDate(day);
													}
												}}
												{...dayProps}
											/>
										);
									})}
								</div>
							);
						})}
					</div>
				</div>
			);
		};

		const renderYearLevel = () => {
			const months = generateYearMatrix(displayedDate);
			return (
				<div className="grid grid-cols-3 gap-2">
					{months.map((m) => {
						const disabled = isDisabledDay(m);
						const monthProps = getMonthControlProps?.(m) || {};
						const handleClick = () => {
							if (disabled || isStatic) return;
							onMonthSelect?.(m);
							setDate(
								new Date(
									displayedDate.getFullYear(),
									m.getMonth(),
									1,
								),
							);
							setLevel("month");
						};
						const label =
							typeof monthsListFormat === "string"
								? m.toLocaleDateString(locale, {
										month: monthsListFormat as
											| "numeric"
											| "2-digit"
											| "long"
											| "short"
											| "narrow",
									})
								: m.toLocaleString(locale, { month: "short" });
						return (
							<button
								key={m.toISOString()}
								{...monthProps}
								onMouseEnter={() => onMonthMouseEnter?.(m)}
								onClick={handleClick}
								className={`p-2 rounded text-sm ${
									disabled
										? "bg-gray-100 text-gray-400 cursor-not-allowed"
										: "hover:bg-blue-100"
								} ${monthProps.className || ""}`}
							>
								{label}
							</button>
						);
					})}
				</div>
			);
		};

		const renderDecadeLevel = () => {
			const years = generateDecadeRange(displayedDate.getFullYear());
			return (
				<div className="grid grid-cols-3 gap-2">
					{years.map((y) => {
						const disabled = isDisabledDay(y);
						const yearProps = getYearControlProps?.(y) || {};
						const handleClick = () => {
							if (disabled || isStatic) return;
							onYearSelect?.(y);
							setDate(
								new Date(
									y.getFullYear(),
									displayedDate.getMonth(),
									1,
								),
							);
							setLevel("year");
						};
						return (
							<button
								key={y.getFullYear()}
								{...yearProps}
								onClick={handleClick}
								className={`p-2 rounded text-sm ${
									disabled
										? "bg-gray-100 text-gray-400 cursor-not-allowed"
										: "hover:bg-blue-100"
								} ${yearProps.className || ""}`}
							>
								{y.getFullYear()}
							</button>
						);
					})}
				</div>
			);
		};

		const handlePrev = () => {
			if (currentLevel === "month") {
				onPrevMonth?.();
				setDate(addMonths(displayedDate, -1));
			} else if (currentLevel === "year") {
				onPrevYear?.();
				setDate(addYears(displayedDate, -1));
			} else {
				onPrevDecade?.();
				setDate(addYears(displayedDate, -12));
			}
		};

		const handleNext = () => {
			if (currentLevel === "month") {
				onNextMonth?.();
				setDate(addMonths(displayedDate, 1));
			} else if (currentLevel === "year") {
				onNextYear?.();
				setDate(addYears(displayedDate, 1));
			} else {
				onNextDecade?.();
				setDate(addYears(displayedDate, 12));
			}
		};

		const titleClick = () => {
			if (currentLevel === "month") setLevel("year");
			else if (currentLevel === "year") setLevel("decade");
		};

		const renderTitle = () => {
			if (currentLevel === "month") {
				const monthLabel =
					typeof monthLabelFormat === "function"
						? monthLabelFormat(displayedDate)
						: typeof monthLabelFormat === "string"
							? displayedDate.toLocaleDateString(locale, {
									month: monthLabelFormat as
										| "numeric"
										| "2-digit"
										| "long"
										| "short"
										| "narrow",
									year: "numeric",
								})
							: displayedDate.toLocaleDateString(locale, {
									month: "long",
									year: "numeric",
								});
				return (
					<button
						onClick={titleClick}
						type="button"
						className="font-semibold hover:underline"
					>
						{monthLabel}
					</button>
				);
			}
			if (currentLevel === "year") {
				return (
					<button
						type="button"
						onClick={titleClick}
						className="font-semibold hover:underline"
					>
						{displayedDate.getFullYear()}
					</button>
				);
			}
			const yr = displayedDate.getFullYear();
			return (
				<button
					type="button"
					onClick={titleClick}
					className="font-semibold hover:underline"
				>
					{yr - 5} - {yr + 6}
				</button>
			);
		};

		const renderContent = () => {
			if (currentLevel === "month") return renderMonthLevel();
			if (currentLevel === "year") return renderYearLevel();
			return renderDecadeLevel();
		};

		return (
			<div
				className={`w-64 p-2 border border-gray-200 rounded shadow-sm space-y-2 ${className || ""}`}
			>
				<div className="flex items-center justify-between">
					<button
						type="button"
						onClick={handlePrev}
						className="p-1 hover:bg-gray-100 rounded"
						aria-label="Previous"
					>
						{prevIcon || "<"}
					</button>
					{renderTitle()}
					<button
						type="button"
						onClick={handleNext}
						className="p-1 hover:bg-gray-100 rounded"
						aria-label="Next"
					>
						{nextIcon || ">"}
					</button>
				</div>
				{renderContent()}
				{nextLabel && (
					<div className="text-center text-sm text-gray-500">
						{nextLabel}
					</div>
				)}
			</div>
		);
	},
	{
		Day: Day,
	},
) as CalendarComponent;
