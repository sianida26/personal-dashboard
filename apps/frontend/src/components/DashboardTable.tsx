import { Table, Center, ScrollArea } from "@mantine/core";
import { Table as ReactTable, flexRender } from "@tanstack/react-table";

interface Props<TData> {
	table: ReactTable<TData>;
}

export default function DashboardTable<T>({ table }: Props<T>) {
	return (
		<ScrollArea.Autosize>
			<Table
				verticalSpacing="xs"
				horizontalSpacing="xs"
				striped
				highlightOnHover
				withColumnBorders
				withRowBorders
			>
				{/* Thead */}
				<Table.Thead>
					{table.getHeaderGroups().map((headerGroup) => (
						<Table.Tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<Table.Th
									key={header.id}
									style={{
										maxWidth: `${header.column.columnDef.maxSize}px`,
										width: `${header.getSize()}`,
									}}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
								</Table.Th>
							))}
						</Table.Tr>
					))}
				</Table.Thead>

				{/* Tbody */}
				<Table.Tbody>
					{table.getRowModel().rows.length > 0 ? (
						table.getRowModel().rows.map((row) => (
							<Table.Tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<Table.Td
										key={cell.id}
										style={{
											maxWidth: `${cell.column.columnDef.maxSize}px`,
										}}
									>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext()
										)}
									</Table.Td>
								))}
							</Table.Tr>
						))
					) : (
						<Table.Tr>
							<Table.Td colSpan={table.getAllColumns().length}>
								<Center>- No Data -</Center>
							</Table.Td>
						</Table.Tr>
					)}
				</Table.Tbody>
			</Table>
		</ScrollArea.Autosize>
	);
}
