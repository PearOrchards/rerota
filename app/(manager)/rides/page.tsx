"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Ellipsis } from "lucide-react";
import { getRides } from "./_actions/getRides";
import { useEffect, useState } from "react";
import { Ride } from "@/generated/prisma/client";

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
		accessorKey: "tier.name",
		header: "Tier",
	},
	{
		id: "actions",
		header: "",
		cell: () => (
			<span><Ellipsis className="m-auto hover:cursor-pointer" /></span>
		),
	},
];

// This is a unique case where the table will not be re-used, as it's more complex than the others.
export default function RidesPage() {
	const [rides, setRides] = useState<Ride[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setRides(await getRides());
			setIsLoading(false);
		};

		fetchData();
	}, []);

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">RIDES</h1>
			<p className="font-normal italic">The long list of all the rides.</p>

			<div className="flex p-4">
				{isLoading ? (
					<p>Loading...</p>
				) : (
					<DataTable data={rides} columns={columns} />
				)}
			</div>
		</main>
	);
}