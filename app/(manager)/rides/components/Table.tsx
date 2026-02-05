"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Tier } from "@/generated/prisma/client";
import type { RideWithExtra } from "@/lib/types/rides";

import { Actions } from "./Actions";

interface TableProps {
	data: RideWithExtra[];
	tiers: Tier[];
	businessId: string;
}

const createColumns = (
	tiers: Tier[],
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
		accessorKey: "competenciesCount",
		header: "Competencies",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<Actions ride={row.original} tiers={tiers} businessId={businessId} />
		),
	},
];


export function Table({ data: rides, tiers, businessId }: TableProps) {
	const columns = createColumns(tiers, businessId);

	return (
		<div className="space-y-4 w-full">
			<DataTable data={rides} columns={columns} />
		</div>
	);
}