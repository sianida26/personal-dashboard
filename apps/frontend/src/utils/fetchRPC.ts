import { ClientResponse } from "hono/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlankRecordToNever<T> = T extends any
	? T extends null
		? null
		: keyof T extends never
			? never
			: T
	: never;

async function fetchRPC<T>(
	endpoint: Promise<ClientResponse<T>>
): Promise<BlankRecordToNever<T>> {
	const res = await endpoint;

	if (res.ok) {
		const data = await res.json();
		return data;
	}

	//TODO: Add error reporting

	const data = (await res.json()) as unknown as { message?: string };

	throw new Error(data.message ?? "Something is gone wrong");
}

export default fetchRPC;
