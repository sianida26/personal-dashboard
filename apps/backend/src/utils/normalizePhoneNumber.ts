/**
 * Normalize a phone number to international format
 *
 * This function standardizes phone numbers by:
 * 1. Removing all non-digit characters except "+"
 * 2. Removing leading "+" if present
 * 3. Adding country code if missing
 * 4. Converting local format (0xxx) to international format
 *
 * @param phone - Phone number to normalize (can include spaces, dashes, parentheses)
 * @param defaultCountryCode - Country code to use when not present (default: "62" for Indonesia)
 * @returns Normalized phone number in international format without "+" prefix
 *
 * @example
 * ```typescript
 * normalizePhoneNumber("08123456789");           // "628123456789"
 * normalizePhoneNumber("+62 812 3456 789");      // "628123456789"
 * normalizePhoneNumber("0812-3456-789");         // "628123456789"
 * normalizePhoneNumber("8123456789");            // "628123456789"
 * normalizePhoneNumber("+1 234 567 8900", "1"); // "12345678900"
 * ```
 */
function normalizePhoneNumber(
	phone: string,
	defaultCountryCode = "62",
): string {
	// Remove all spaces and non-digit characters except "+"
	let normalizedPhone = phone.replace(/[^+\d]/g, "");

	if (normalizedPhone.startsWith("+")) {
		// If it starts with a "+", remove the "+" to standardize
		normalizedPhone = normalizedPhone.substring(1);
	} else if (normalizedPhone.startsWith("0")) {
		// If it starts with "0", prepend the default country code
		normalizedPhone = defaultCountryCode + normalizedPhone.substring(1);
	} else if (!normalizedPhone.startsWith(defaultCountryCode)) {
		// If it doesn't start with the default country code or another country code
		normalizedPhone = defaultCountryCode + normalizedPhone;
	}

	return normalizedPhone;
}

export default normalizePhoneNumber;
