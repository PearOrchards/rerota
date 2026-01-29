"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Ride } from "@/generated/prisma/client";
import { DataTable } from "@/components/DataTable";
import { Ellipsis } from "lucide-react";

const details: Ride[] = [
	{
		id: "1",
		name: "The Triangle",
		description: "The point of the UK.",
		tierId: "4",
	},
	{
		id: "2",
		name: "The Square",
		description: "This description has a really long description which would have no way of fitting normally, so it gets cut. RIP.",
		tierId: "4",
	},
];

const columns: ColumnDef<Ride, unknown>[] = [
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
		accessorKey: "tierId",
		header: "Tier",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<span><Ellipsis className="m-auto hover:cursor-pointer" /></span>
		),
	},
];

// This is a unique case where the table will not be re-used, as it's more complex than the others.
export default function RidesPage() {
	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">RIDES</h1>
			<p className="font-normal italic">The long list of all the rides.</p>

			<div className="flex p-4">
				<DataTable data={details} columns={columns} />
			</div>
		</main>
	);
}