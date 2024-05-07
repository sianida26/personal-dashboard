import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";
import { queryOptions } from "@tanstack/react-query";
import { InferRequestType } from "hono";

export const userQueryOptions = queryOptions({
	queryKey: ["users"],
	queryFn: () => fetchUsers(),
});

export const fetchUsers = async () => {
	return await fetchRPC(
		client.users.$get({
			query: {},
		})
	);
};

export const createUser = async (
	form: InferRequestType<typeof client.users.$post>["form"]
) => {
	return await fetchRPC(
		client.users.$post({
			form,
		})
	);
};

export const updateUser = async (
	form: InferRequestType<(typeof client.users)[":id"]["$patch"]>["form"] & {
		id: string;
	}
) => {
	return await fetchRPC(
		client.users[":id"].$patch({
			param: {
				id: form.id,
			},
			form,
		})
	);
};

export const deleteUser = async (id: string) => {
	return await client.users[":id"].$delete({
		param: { id },
		form: {},
	});
};
