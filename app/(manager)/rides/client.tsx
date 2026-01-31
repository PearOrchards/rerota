"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Ellipsis, Pencil, Trash } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Ride } from ".prisma/client/client";
import { use } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const columns: ColumnDef<Ride>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => (
			<span className="truncate">{ row.getValue("description") }</span>
		),
	},
	{
		accessorKey: "tier.name",
		header: "Tier",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<Actions ride={row.original} />
		),
	},
];

function Actions({ ride }: { ride: Ride }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<DropdownMenuItem className="hover:cursor-pointer"><Pencil /> Edit</DropdownMenuItem>
				<DropdownMenuItem className="hover:cursor-pointer"><Copy /> Duplicate</DropdownMenuItem>
				<DropdownMenuItem className="hover:cursor-pointer"><Trash /> Delete</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function Client({ data }: { data: Promise<Ride[]> }) {
	const rides = use(data);

	return (
		<DataTable data={rides} columns={columns} />
	);
}