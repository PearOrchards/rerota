"use client";

import { DraggableDataTable } from "@/components/DraggableDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Tier } from "@/generated/prisma/client";
import { updateTierOrders } from "@/lib/actions/rides";
import { useOptimistic } from "react";

const columns: ColumnDef<Tier>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
];

export function TiersTable({ tiers }: { tiers: Tier[] }) {
	const [optimisticTiers, setOptimisticTiers] = useOptimistic(tiers);

	const handleReorder = async (reorderedTiers: Tier[]) => {
		setOptimisticTiers(reorderedTiers);
		await updateTierOrders(reorderedTiers);
	};

	return <DraggableDataTable data={optimisticTiers} columns={columns} onReorder={handleReorder} />;
}

