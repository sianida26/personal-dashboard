import client from "@/honoClient";
import fetchRPC from "@/utils/fetchRPC";
import { queryOptions } from "@tanstack/react-query";
import { InferRequestType } from "hono";

export const userQueryOptions = (page: number, limit: number, q?: string) =>
	queryOptions({
		queryKey: ["users", { page, limit, q }],
		queryFn: () =>
			fetchRPC(
				client.users.$get({
					query: {
						limit: String(limit),
						page: String(page),
						q,
					},
				})
			),
	});

export const getUserByIdQueryOptions = (userId: string | undefined) =>
	queryOptions({
		queryKey: ["user", userId],
		queryFn: () =>
			fetchRPC(
				client.users[":id"].$get({
					param: {
						id: userId!,
					},
					query: {},
				})
			),
		enabled: Boolean(userId),
	});

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
	return await fetchRPC(
		client.users[":id"].$delete({
			param: { id },
			form: {},
		})
	);
};
