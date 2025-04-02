import { useState, useEffect, useRef } from "react";

/**
 * Debounces value changes for controlled components.
 * Returns a debounced value that only updates after the specified delay has passed,
 * and a function to cancel pending updates.
 *
 * @param value - The value to be debounced
 * @param wait - The delay in milliseconds
 * @param options - Additional options
 * @param options.leading - If true, update the value immediately on the first call, then wait for the delay
 * @returns A tuple containing the debounced value and a function to cancel updates
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [value, setValue] = useState('');
 * const [debounced] = useDebouncedValue(value, 200);
 *
 * // With leading update
 * const [debounced] = useDebouncedValue(value, 200, { leading: true });
 *
 * // With cancel function
 * const [debounced, cancel] = useDebouncedValue(value, 1000);
 * <Button onClick={cancel}>Cancel Update</Button>
 * ```
 */
export function useDebouncedValue<T>(
	value: T,
	wait: number,
	options?: {
		leading?: boolean;
	},
): readonly [T, () => void] {
	const [debouncedValue, setDebouncedValue] = useState<T>(
		options?.leading ? value : ("" as unknown as T),
	);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const leadingRef = useRef(true);
	const valueRef = useRef(value);

	const clearTimeoutRef = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	const cancelDebouncedUpdate = () => {
		clearTimeoutRef();
	};

	useEffect(() => {
		valueRef.current = value;
		clearTimeoutRef();

		// If leading is true and it's the first update, set the value immediately
		if (options?.leading && leadingRef.current) {
			setDebouncedValue(value);
			leadingRef.current = false;
			return;
		}

		timeoutRef.current = setTimeout(() => {
			setDebouncedValue(valueRef.current);
			leadingRef.current = options?.leading ?? false;
		}, wait);

		// Cleanup on unmount
		return () => {
			clearTimeoutRef();
		};
	}, [value, wait, options?.leading]);

	return [debouncedValue, cancelDebouncedUpdate] as const;
}
