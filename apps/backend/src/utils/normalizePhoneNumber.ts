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
