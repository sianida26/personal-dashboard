class FormResponseError extends Error {
	public readonly message: string;
	public readonly formErrors: Record<string, string>;

	constructor(message: string, formErrors: Record<string, string>) {
		super(message);

		this.message = message;
		this.formErrors = formErrors;

		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default FormResponseError;
