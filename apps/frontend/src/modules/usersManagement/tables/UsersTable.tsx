import { Button, Flex, Text } from "@mantine/core";
import { Link, getRouteApi } from "@tanstack/react-router";
import React from "react";
import { TbPlus } from "react-icons/tb";
import DashboardTable from "../../../components/DashboardTable";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import createColumns from "./columns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueryOptions } from "../queries/userQueries";
import UserFormModal from "../modals/UserFormModal";
import UserDeleteModal from "../modals/UserDeleteModal";

const routeApi = getRouteApi("/_dashboardLayout/users/");

export default function UsersTable() {
	const navigate = routeApi.useNavigate();

	const usersQuery = useSuspenseQuery(userQueryOptions);

	const table = useReactTable({
		data: usersQuery.data,
		columns: createColumns({
			permissions: {
				create: true,
				read: true,
				delete: true,
				update: true,
			},
			actions: {
				detail: (id: string) =>
					navigate({
						search: {
							detail: id,
						},
					}),
				edit: (id: string) =>
					navigate({
						search: {
							edit: id,
						},
					}),
				delete: (id: string) =>
					navigate({
						search: {
							delete: id,
						},
					}),
			},
		}),
		getCoreRowModel: getCoreRowModel(),
		defaultColumn: {
			cell: (props) => <Text>{props.getValue() as React.ReactNode}</Text>,
		},
	});

	return (
		<>
			<Flex justify="flex-end">
				<Button
					leftSection={<TbPlus />}
					component={Link}
					search={{ create: true }}
				>
					New User
				</Button>
			</Flex>

			<DashboardTable table={table} />

			<UserFormModal />
			<UserDeleteModal />
		</>
	);
}
