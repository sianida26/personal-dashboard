import { useMemo } from "react";

export interface UseTableGroupingProps<T> {
	/**
	 * The current groupBy column key
	 */
	groupBy: string | null;

	/**
	 * All data items to group
	 */
	data: T[];

	/**
	 * State of expanded groups
	 */
	expandedGroups: Record<string, boolean>;

	/**
	 * Setter for expanded groups
	 */
	setExpandedGroups: React.Dispatch<
		React.SetStateAction<Record<string, boolean>>
	>;
}

export interface UseTableGroupingReturn<T> {
	/**
	 * Grouped data as a Map of group values to arrays of items
	 */
	groupedData: Map<string, T[]> | null;

	/**
	 * Whether data is currently grouped
	 */
	isGrouped: boolean;

	/**
	 * Toggle expansion state of a group
	 */
	toggleGroup: (groupValue: string) => void;

	/**
	 * Check if a group is expanded
	 */
	isGroupExpanded: (groupValue: string) => boolean;
}

/**
 * Custom hook for table grouping logic
 *
 * Handles:
 * - Grouping data by a specific column
 * - Managing group expansion state
 * - Toggling individual groups
 */
export function useTableGrouping<T>({
	groupBy,
	data,
	expandedGroups,
	setExpandedGroups,
}: UseTableGroupingProps<T>): UseTableGroupingReturn<T> {
	// Group data if groupBy is set
	const groupedData = useMemo(() => {
		if (!groupBy) return null;

		const groups = new Map<string, T[]>();

		for (const item of data) {
			const groupValue = String(
				(item as Record<string, unknown>)[groupBy] ?? "",
			);
			if (!groups.has(groupValue)) {
				groups.set(groupValue, []);
			}
			groups.get(groupValue)?.push(item);
		}

		return groups;
	}, [data, groupBy]);

	// Check if data is grouped
	const isGrouped = groupBy !== null && groupedData !== null;

	// Toggle group expansion
	const toggleGroup = (groupValue: string) => {
		setExpandedGroups((prev) => ({
			...prev,
			[groupValue]: !prev[groupValue],
		}));
	};

	// Check if a group is expanded
	const isGroupExpanded = (groupValue: string) => {
		return expandedGroups[groupValue] ?? false;
	};

	return {
		groupedData,
		isGrouped,
		toggleGroup,
		isGroupExpanded,
	};
}
