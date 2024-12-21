function normalizePhoneNumber(
	phone: string,
	defaultCountryCode: string = "62"
): string {
	// Remove all spaces and non-digit characters except "+"
	phone = phone.replace(/[^+\d]/g, "");

	if (phone.startsWith("+")) {
		// If it starts with a "+", remove the "+" to standardize
		phone = phone.substring(1);
	} else if (phone.startsWith("0")) {
		// If it starts with "0", prepend the default country code
		phone = defaultCountryCode + phone.substring(1);
	} else if (!phone.startsWith(defaultCountryCode)) {
		// If it doesn't start with the default country code or another country code
		phone = defaultCountryCode + phone;
	}

	return phone;
}

export default normalizePhoneNumber;