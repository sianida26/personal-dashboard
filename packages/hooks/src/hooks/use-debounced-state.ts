import { useState, useRef, useEffect } from "react";

/**
 * Creates a debounced state that only updates after the specified delay has passed.
 * Useful for uncontrolled components where you want to debounce value changes.
 *
 * @param defaultValue - The initial state value
 * @param wait - The delay in milliseconds
 * @param options - Additional options
 * @param options.leading - If true, update the value immediately on the first call, then wait for the delay
 * @returns A tuple containing the debounced value and a function to update it
 *
 * @example
 * ```tsx
 * const [value, setValue] = useDebouncedState('', 200);
 *
 * // With leading update
 * const [value, setValue] = useDebouncedState('', 200, { leading: true });
 *
 * // Usage in an input
 * <input
 *   defaultValue={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 * ```
 */
export function useDebouncedState<T>(
	defaultValue: T,
	wait: number,
	options?: {
		leading?: boolean;
	},
): readonly [T, (value: T) => void] {
	const [state, setState] = useState<T>(defaultValue);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const leadingRef = useRef(true);

	const clearTimeoutRef = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	};

	// Clean up the timeout when the component unmounts
	useEffect(() => {
		return clearTimeoutRef;
	}, []);

	const debouncedSetState = (value: T) => {
		clearTimeoutRef();

		// If leading is true and it's the first update, set the value immediately
		if (options?.leading && leadingRef.current) {
			setState(value);
			leadingRef.current = false;
			return;
		}

		timeoutRef.current = setTimeout(() => {
			setState(value);
			leadingRef.current = options?.leading ?? false;
		}, wait);
	};

	return [state, debouncedSetState] as const;
}
