/**
 * Filter Engine for AdaptiveTable
 *
 * This engine provides a flexible, extensible filtering system that supports:
 * - Multiple filter types (text, number, date, boolean, select)
 * - Various operators per type
 * - Compound filters with AND/OR logic (prepared for future implementation)
 * - Type-safe filter definitions
 */

// Filter operator types
export type TextFilterOperator =
	| "is"
	| "is_not"
	| "contains"
	| "does_not_contain"
	| "starts_with"
	| "ends_with"
	| "is_empty"
	| "is_not_empty";

export type NumberFilterOperator =
	| "equals"
	| "not_equals"
	| "greater_than"
	| "less_than"
	| "greater_than_or_equals"
	| "less_than_or_equals"
	| "is_empty"
	| "is_not_empty";

export type DateFilterOperator =
	| "is"
	| "is_not"
	| "is_before"
	| "is_after"
	| "is_on_or_before"
	| "is_on_or_after"
	| "is_empty"
	| "is_not_empty";

export type BooleanFilterOperator = "is_true" | "is_false";

export type SelectFilterOperator =
	| "is"
	| "is_not"
	| "is_empty"
	| "is_not_empty";

export type FilterOperator =
	| TextFilterOperator
	| NumberFilterOperator
	| DateFilterOperator
	| BooleanFilterOperator
	| SelectFilterOperator;

// Filter types
export type FilterType = "text" | "number" | "date" | "boolean" | "select";

// Operator labels for UI display
export const operatorLabels: Record<FilterOperator, string> = {
	// Text operators
	is: "Is",
	is_not: "Is not",
	contains: "Contains",
	does_not_contain: "Does not contain",
	starts_with: "Starts with",
	ends_with: "Ends with",
	// Number operators
	equals: "Equals",
	not_equals: "Not equals",
	greater_than: "Greater than",
	less_than: "Less than",
	greater_than_or_equals: "Greater than or equals",
	less_than_or_equals: "Less than or equals",
	// Date operators
	is_before: "Is before",
	is_after: "Is after",
	is_on_or_before: "Is on or before",
	is_on_or_after: "Is on or after",
	// Boolean operators
	is_true: "Is true",
	is_false: "Is false",
	// Common operators
	is_empty: "Is empty",
	is_not_empty: "Is not empty",
};

// Operators by filter type
export const operatorsByType: Record<FilterType, FilterOperator[]> = {
	text: [
		"is",
		"is_not",
		"contains",
		"does_not_contain",
		"starts_with",
		"ends_with",
		"is_empty",
		"is_not_empty",
	],
	number: [
		"equals",
		"not_equals",
		"greater_than",
		"less_than",
		"greater_than_or_equals",
		"less_than_or_equals",
		"is_empty",
		"is_not_empty",
	],
	date: [
		"is",
		"is_not",
		"is_before",
		"is_after",
		"is_on_or_before",
		"is_on_or_after",
		"is_empty",
		"is_not_empty",
	],
	boolean: ["is_true", "is_false"],
	select: ["is", "is_not", "is_empty", "is_not_empty"],
};

// Default operators by type
export const defaultOperatorByType: Record<FilterType, FilterOperator> = {
	text: "contains",
	number: "equals",
	date: "is",
	boolean: "is_true",
	select: "is",
};

// Single filter condition
export interface FilterCondition {
	id: string; // Unique identifier for this filter
	columnId: string;
	operator: FilterOperator;
	value?: string | number | boolean | Date | null;
	filterType: FilterType;
}

// Compound filter (for future AND/OR support)
export type LogicalOperator = "and" | "or";

export interface CompoundFilter {
	logic: LogicalOperator;
	conditions: (FilterCondition | CompoundFilter)[];
}

// Filter state can be simple conditions or compound
export type FilterState = FilterCondition[];

// For future: export type AdvancedFilterState = CompoundFilter;

/**
 * Check if an operator requires a value input
 */
export function operatorRequiresValue(operator: FilterOperator): boolean {
	const noValueOperators: FilterOperator[] = [
		"is_empty",
		"is_not_empty",
		"is_true",
		"is_false",
	];
	return !noValueOperators.includes(operator);
}

/**
 * Get value from nested object path (e.g., "user.name" from { user: { name: "John" } })
 */
function getNestedValue<T>(obj: T, path: string): unknown {
	const keys = path.split(".");
	let value: unknown = obj;
	for (const key of keys) {
		if (value === null || value === undefined) return undefined;
		value = (value as Record<string, unknown>)[key];
	}
	return value;
}

/**
 * Apply a single filter condition to a value
 */
export function applyFilterCondition<T>(
	item: T,
	condition: FilterCondition,
	accessorFn?: (row: T) => unknown,
): boolean {
	// Get the value from the item
	const rawValue = accessorFn
		? accessorFn(item)
		: getNestedValue(item, condition.columnId);

	const { operator, value: filterValue, filterType } = condition;

	// Handle empty checks first (work for all types)
	if (operator === "is_empty") {
		return (
			rawValue === null ||
			rawValue === undefined ||
			rawValue === "" ||
			(Array.isArray(rawValue) && rawValue.length === 0)
		);
	}
	if (operator === "is_not_empty") {
		return (
			rawValue !== null &&
			rawValue !== undefined &&
			rawValue !== "" &&
			!(Array.isArray(rawValue) && rawValue.length === 0)
		);
	}

	// Handle boolean type
	if (filterType === "boolean") {
		const boolValue = Boolean(rawValue);
		if (operator === "is_true") return boolValue === true;
		if (operator === "is_false") return boolValue === false;
		return true;
	}

	// For other operators, we need a filter value (except empty checks handled above)
	if (filterValue === null || filterValue === undefined) {
		return true; // No filter value means no filtering
	}

	// Handle text type
	if (filterType === "text") {
		const strValue = String(rawValue ?? "").toLowerCase();
		const strFilterValue = String(filterValue).toLowerCase();

		switch (operator) {
			case "is":
				return strValue === strFilterValue;
			case "is_not":
				return strValue !== strFilterValue;
			case "contains":
				return strValue.includes(strFilterValue);
			case "does_not_contain":
				return !strValue.includes(strFilterValue);
			case "starts_with":
				return strValue.startsWith(strFilterValue);
			case "ends_with":
				return strValue.endsWith(strFilterValue);
			default:
				return true;
		}
	}

	// Handle number type
	if (filterType === "number") {
		const numValue = Number(rawValue);
		const numFilterValue = Number(filterValue);

		if (Number.isNaN(numValue) || Number.isNaN(numFilterValue)) {
			return true; // Invalid numbers, don't filter
		}

		switch (operator) {
			case "equals":
				return numValue === numFilterValue;
			case "not_equals":
				return numValue !== numFilterValue;
			case "greater_than":
				return numValue > numFilterValue;
			case "less_than":
				return numValue < numFilterValue;
			case "greater_than_or_equals":
				return numValue >= numFilterValue;
			case "less_than_or_equals":
				return numValue <= numFilterValue;
			default:
				return true;
		}
	}

	// Handle date type
	if (filterType === "date") {
		const dateValue =
			rawValue instanceof Date ? rawValue : new Date(String(rawValue));
		const dateFilterValue =
			filterValue instanceof Date
				? filterValue
				: new Date(String(filterValue));

		if (
			Number.isNaN(dateValue.getTime()) ||
			Number.isNaN(dateFilterValue.getTime())
		) {
			return true; // Invalid dates, don't filter
		}

		// Normalize to start of day for comparison
		const normalizeDate = (d: Date) =>
			new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
		const normalizedValue = normalizeDate(dateValue);
		const normalizedFilter = normalizeDate(dateFilterValue);

		switch (operator) {
			case "is":
				return normalizedValue === normalizedFilter;
			case "is_not":
				return normalizedValue !== normalizedFilter;
			case "is_before":
				return normalizedValue < normalizedFilter;
			case "is_after":
				return normalizedValue > normalizedFilter;
			case "is_on_or_before":
				return normalizedValue <= normalizedFilter;
			case "is_on_or_after":
				return normalizedValue >= normalizedFilter;
			default:
				return true;
		}
	}

	// Handle select type
	if (filterType === "select") {
		const selectValue = String(rawValue ?? "");
		const selectFilterValue = String(filterValue);

		switch (operator) {
			case "is":
				return selectValue === selectFilterValue;
			case "is_not":
				return selectValue !== selectFilterValue;
			default:
				return true;
		}
	}

	return true;
}

/**
 * Apply multiple filter conditions to data array (AND logic)
 */
export function applyFilters<T>(
	data: T[],
	filters: FilterState,
	accessorFns?: Record<string, (row: T) => unknown>,
): T[] {
	if (filters.length === 0) return data;

	return data.filter((item) =>
		filters.every((condition) =>
			applyFilterCondition(
				item,
				condition,
				accessorFns?.[condition.columnId],
			),
		),
	);
}

/**
 * Future: Apply compound filter with AND/OR logic
 */
export function applyCompoundFilter<T>(
	data: T[],
	filter: CompoundFilter,
	accessorFns?: Record<string, (row: T) => unknown>,
): T[] {
	if (filter.conditions.length === 0) return data;

	return data.filter((item) => {
		const results = filter.conditions.map((condition) => {
			if ("logic" in condition) {
				// Nested compound filter
				return (
					applyCompoundFilter([item], condition, accessorFns).length >
					0
				);
			}
			return applyFilterCondition(
				item,
				condition,
				accessorFns?.[condition.columnId],
			);
		});

		if (filter.logic === "and") {
			return results.every(Boolean);
		}
		return results.some(Boolean);
	});
}

/**
 * Generate a unique filter ID
 */
export function generateFilterId(): string {
	return `filter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new filter condition with defaults
 */
export function createFilterCondition(
	columnId: string,
	filterType: FilterType,
	operator?: FilterOperator,
): FilterCondition {
	return {
		id: generateFilterId(),
		columnId,
		filterType,
		operator: operator ?? defaultOperatorByType[filterType],
		value: undefined,
	};
}
