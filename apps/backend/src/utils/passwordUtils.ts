// Number of rounds for generating the salt.
const saltRounds = 10;

/**
 * Hashes a password using bcrypt with a predefined number of salt rounds.
 *
 * @param password - The plaintext password to hash.
 * @returns A promise that resolves to the hashed password string.
 */
export const hashPassword = async (password: string) => {
	return await Bun.password.hash(password, {
		algorithm: "bcrypt",
		cost: saltRounds,
	});
};

/**
 * Checks if a plaintext password matches a given hash.
 *
 * @param password - The plaintext password to verify.
 * @param hash - The hash to compare against the password.
 * @returns A promise that resolves to a boolean indicating whether the password matches the hash.
 */
export const checkPassword = async (password: string, hash: string) => {
	return await Bun.password.verify(password, hash, "bcrypt");
};
