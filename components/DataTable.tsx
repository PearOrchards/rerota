"use client";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
}

export function DataTable<TData>({
	columns, data,
}: DataTableProps<TData>) {
	// eslint-disable-next-line react-hooks/incompatible-library
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="overflow-hidden rounded-lg border shadow-lg w-full">
			<Table>
				<TableHeader>
					{ table.getHeaderGroups().map(group => (
						<TableRow key={group.id}>
							{ group.headers.map(header => (
								<TableHead key={header.id}>
									{ header.isPlaceholder
										? null
										: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)
									}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{ table.getRowModel().rows?.length
						? table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{ row.getVisibleCells().map(cell => (
									<TableCell key={cell.id}>
										{ flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						)) : (
							<TableRow>
								<TableCell colSpan={columns.length}>
									No results...
								</TableCell>
							</TableRow>
						)
					}
				</TableBody>
			</Table>
		</div>
	);
}