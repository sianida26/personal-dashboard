/**
 * Formats a number into the Indonesian Rupiah currency format.
 *
 * @param value - The number to be formatted.
 * @returns A string representing the formatted Rupiah value.
 *
 * * @example
 * ```
 * const rupiahValue = formatRupiah(123456789);
 * console.log(rupiahValue); // Output: "Rp 123.456.789"
 * ```
 */
function formatRupiah(value: number): string {
	const formatted = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	return `Rp ${formatted}`;
}

export default formatRupiah;
