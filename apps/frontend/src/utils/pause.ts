/**
 * Pauses the execution for a specified duration.
 *
 * @param duration - The duration of the pause in milliseconds.
 * @returns A promise that resolves after the specified duration.
 */
function pause(duration: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, duration));
}

export default pause;
