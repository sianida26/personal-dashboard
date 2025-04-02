import { useCallback, useRef } from "react";

/**
 * Creates a debounced version of a callback function.
 * The debounced function will only be called after a specified delay has passed
 * since the last time it was called.
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds before the callback is executed
 * @returns A debounced version of the callback function
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((query: string) => {
 *   // Perform search operation
 * }, 500);
 *
 * // Usage in an event handler
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
	callback: T,
	delay: number,
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	return useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		},
		[callback, delay],
	);
}
