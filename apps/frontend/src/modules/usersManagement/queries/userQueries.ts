import client from "@/honoClient";
import { queryOptions } from "@tanstack/react-query";
import { InferRequestType } from "hono";

export const userQueryOptions = queryOptions({
	queryKey: ["users"],
	queryFn: () => fetchUsers(),
});

export const fetchUsers = async () => {
	const res = await client.users.$get({
		query: {},
	});

	if (res.ok) {
		return await res.json();
	}

	//TODO: Handle error
	throw new Error(res.statusText);
};

export const createUser = async (
	form: InferRequestType<typeof client.users.$post>["form"]
) => {
	const res = await client.users.$post({
		form,
	});

	if (res.ok) {
		return await res.json();
	}

	//TODO: Handle error
	throw Error(await res.text());
};

export const updateUser = async (
	form: InferRequestType<(typeof client.users)[":id"]["$patch"]>["form"] & {
		id: string;
	}
) => {
	form;
	const res = await client.users[":id"].$patch({
		param: {
			id: form.id,
		},
		form,
	});

	if (res.ok) {
		return await res.json();
	}

	//TODO: Handle error
	throw new Error(await res.text());
};

export const deleteUser = async (id: string) => {
	const res = await client.users[":id"].$delete({
		param: {
			id,
		},
		form: {},
	});

	if (res.ok) {
		return await res.json();
	}

	//TODO: Handle error
	throw new Error(await res.text());
};
