"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Ellipsis, Pencil, Plus, Trash } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Ride, Tier } from "@/generated/prisma/client";
import { use } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RideFormModal } from "./RideFormModal";
import { Button } from "@/components/ui/button";

interface TableProps {
	data: Promise<Ride[]>;
	tiers: Promise<Tier[]>;
	businessId: string;
}

const createColumns = (
	tiers: Tier[],
	businessId: string,
): ColumnDef<Ride>[] => [
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
			<Actions ride={row.original} tiers={tiers} businessId={businessId} />
		),
	},
];

function Actions({
	ride,
	tiers,
	businessId,
}: {
	ride: Ride;
	tiers: Tier[];
	businessId: string;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<RideFormModal
					ride={ride}
					trigger={
						<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:cursor-pointer">
							<Pencil /> Edit
						</DropdownMenuItem>
					}
					availableTiers={tiers}
					businessId={businessId}
				/>
				<DropdownMenuItem className="hover:cursor-pointer"><Copy /> Duplicate</DropdownMenuItem>
				<DropdownMenuItem className="hover:cursor-pointer"><Trash /> Delete</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function Table({ data, tiers, businessId }: TableProps) {
	const rides = use(data);
	const tierList = use(tiers);
	const columns = createColumns(tierList, businessId);

	return (
		<div className="space-y-4 w-full">
			<div className="flex justify-end">
				<RideFormModal
					trigger={
						<Button>
							<Plus /> New Ride
						</Button>
					}
					availableTiers={tierList}
					businessId={businessId}
				/>
			</div>
			<DataTable data={rides} columns={columns} />
		</div>
	);
}