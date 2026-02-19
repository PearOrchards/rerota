"use client";

import { DraggableDataTable } from "@/components/DraggableDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Position } from "@/generated/prisma/client";
import { updatePositionOrders } from "@/lib/actions/positions";
import { useOptimistic } from "react";
import { Actions } from "./Actions";
import { toast } from "sonner";

const columns: ColumnDef<Position>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => {
			const position = row.original;
			return <Actions position={position} />;
		},
	},
];

export function PositionsTable({ positions }: { positions: Position[] }) {
	const [optimisticPositions, setOptimisticPositions] = useOptimistic(positions);

	const handleReorder = async (reorderedPositions: Position[]) => {
		setOptimisticPositions(reorderedPositions);
		const response = await updatePositionOrders(reorderedPositions);
		if (!response.success) {
			toast.error(response.message || "Failed to update position order.");
		}
	};

	return <DraggableDataTable data={optimisticPositions} columns={columns} onReorder={handleReorder} />;
}
