"use client";

import { DraggableDataTable } from "@/components/DraggableDataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Position } from "@/generated/prisma/client";
import { updatePositionOrders } from "@/lib/actions/positions";
import { useOptimistic } from "react";
import { Actions } from "./Actions";

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
		await updatePositionOrders(reorderedPositions);
	};

	return <DraggableDataTable data={optimisticPositions} columns={columns} onReorder={handleReorder} />;
}

