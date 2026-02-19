"use client";

import { DraggableDataTable } from "@/components/DraggableDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Tier } from "@/generated/prisma/client";
import { updateTierOrders } from "@/lib/actions/tiers";
import { useOptimistic } from "react";
import { Actions } from "./Actions";
import { toast } from "sonner";

const columns: ColumnDef<Tier>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const tier = row.original;
			return <Actions tier={tier} />;
		},
	},
];

export function TiersTable({ tiers }: { tiers: Tier[] }) {
	const [optimisticTiers, setOptimisticTiers] = useOptimistic(tiers);

	const handleReorder = async (reorderedTiers: Tier[]) => {
		setOptimisticTiers(reorderedTiers);
		const response = await updateTierOrders(reorderedTiers);
		if (!response.success) {
			toast.error(response.message || "Failed to update tier order.");
		}
	};

	return <DraggableDataTable data={optimisticTiers} columns={columns} onReorder={handleReorder} />;
}
