"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Position, Tier } from "@/generated/prisma/client";
import type { RideWithExtra } from "@/lib/types/rides";

import { Actions } from "./Actions";

interface TableProps {
	data: RideWithExtra[];
	tiers: Tier[];
	positions: Position[];
	businessId: string;
}

const createColumns = (
	tiers: Tier[],
	positions: Position[],
	businessId: string,
): ColumnDef<RideWithExtra>[] => [
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
		id: "roles",
		header: "Roles",
		cell: ({ row }) => (
			<span className="truncate">
				{row.original.ridePositions
					.map((ridePosition) => (
						ridePosition.quantity > 1
							? `${ridePosition.position.name} x${ridePosition.quantity}`
							: ridePosition.position.name
					))
					.join(", ")}
			</span>
		),
	},
	{
		accessorKey: "competenciesCount",
		header: "Competencies",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<Actions
				ride={row.original}
				tiers={tiers}
				positions={positions}
				businessId={businessId}
			/>
		),
	},
];


export function Table({ data: rides, tiers, positions, businessId }: TableProps) {
	const columns = createColumns(tiers, positions, businessId);

	return (
		<div className="space-y-4 w-full">
			<DataTable data={rides} columns={columns} />
		</div>
	);
}
