import type { AdaptiveColumnDef, TableState } from "./types";

// Helper functions for localStorage
const STORAGE_PREFIX = "adaptive-table-";

export function getStorageKey(saveKey: string): string {
	return `${STORAGE_PREFIX}${saveKey}`;
}

export function loadTableState(saveKey: string): TableState | null {
	try {
		const stored = localStorage.getItem(getStorageKey(saveKey));
		return stored ? JSON.parse(stored) : null;
	} catch (error) {
		console.error("Failed to load table state:", error);
		return null;
	}
}

export function saveTableState(saveKey: string, state: TableState): void {
	try {
		localStorage.setItem(getStorageKey(saveKey), JSON.stringify(state));
	} catch (error) {
		console.error("Failed to save table state:", error);
	}
}

export function resetTableState(saveKey: string): void {
	try {
		localStorage.removeItem(getStorageKey(saveKey));
	} catch (error) {
		console.error("Failed to reset table state:", error);
	}
}

export function ensureColumnIds<T>(
	columns: AdaptiveColumnDef<T>[],
): AdaptiveColumnDef<T>[] {
	return columns.map((col, index) => {
		if (col.id) return col;

		// Try to use accessorKey as ID if available
		if ("accessorKey" in col && col.accessorKey) {
			return { ...col, id: String(col.accessorKey) };
		}

		// Fallback to index-based ID
		return { ...col, id: `column_${index}` };
	});
}
