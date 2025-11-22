import { useState, useEffect } from "react";

/**
 * Custom hook for tracking the state of a media query.
 * @param query The media query string (e.g., '(max-width: 768px)').
 * @returns `true` if the media query matches, `false` otherwise.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(getMatches(query));

	useEffect(() => {
		const matchMedia = window.matchMedia(query);

		// Triggered at the first client-side load and if query changes
		const handleChange = () => {
			setMatches(getMatches(query));
		};

		handleChange(); // Set initial state

		// Listen matchMedia
		matchMedia.addEventListener("change", handleChange);

		return () => {
			matchMedia.removeEventListener("change", handleChange);
		};
	}, [query]);

	return matches;
}

function getMatches(query: string): boolean {
	// Prevents SSR issues
	if (typeof window !== "undefined") {
		return window.matchMedia(query).matches;
	}
	return false;
}
