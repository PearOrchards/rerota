"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

interface MatrixDetail {
	rideTier: number; // Ride Intensity 1 - 4
	positionTier: string; // Positions on Ride (Att, Op)
	trainingDuration: number; // in hours
	trainingExpiry: number; // in days
	competencyExpiry: number; // days
	competencyToTrainDuration: number; // also days
}

const details: MatrixDetail[] = [
	{
		rideTier: 1,
		positionTier: "Operator",
		trainingDuration: 5,
		trainingExpiry: 15,
		competencyExpiry: 60,
		competencyToTrainDuration: 120,
	},
	{
		rideTier: 1,
		positionTier: "Attendant",
		trainingDuration: 5,
		trainingExpiry: 15,
		competencyExpiry: 60,
		competencyToTrainDuration: 60,
	},
	{
		rideTier: 2,
		positionTier: "Operator",
		trainingDuration: 10,
		trainingExpiry: 10,
		competencyExpiry: 45,
		competencyToTrainDuration: 150,
	},
	{
		rideTier: 2,
		positionTier: "Attendant",
		trainingDuration: 5,
		trainingExpiry: 15,
		competencyExpiry: 60,
		competencyToTrainDuration: 120,
	},
	{
		rideTier: 3,
		positionTier: "Operator",
		trainingDuration: 15,
		trainingExpiry: 10,
		competencyExpiry: 30,
		competencyToTrainDuration: 180,
	},
	{
		rideTier: 3,
		positionTier: "Attendant",
		trainingDuration: 10,
		trainingExpiry: 10,
		competencyExpiry: 45,
		competencyToTrainDuration: 150,
	},
	{
		rideTier: 4,
		positionTier: "Operator",
		trainingDuration: 20,
		trainingExpiry: 7,
		competencyExpiry: 20,
		competencyToTrainDuration: 240,
	},
	{
		rideTier: 4,
		positionTier: "Attendant",
		trainingDuration: 15,
		trainingExpiry: 10,
		competencyExpiry: 30,
		competencyToTrainDuration: 180,
	},
];

const columns: ColumnDef<MatrixDetail, unknown>[] = [
	{
		accessorKey: "rideTier",
		header: "Ride Tier",
		cell: ({ row }) => (
			<div key={row.id} className="font-black">{ row.getValue("rideTier") }</div>
		),
	},
	{
		accessorKey: "positionTier",
		header: "Position Tier",
		cell: ({ row }) => (
			<div key={row.id} className="font-semibold">{ row.getValue("positionTier") }</div>
		),
	},
	{
		accessorKey: "trainingDuration",
		header: "Duration of",
		cell: ({ row }) => (
			<span key={row.id}>
				<Input type="number" value={row.getValue("trainingDuration")} className="w-16 mr-2 text-center" />
				hours
			</span>
		),
	},
	{
		accessorKey: "trainingExpiry",
		header: "until Expiry",
		cell: ({ row }) => (
			<span key={row.id}>
				<Input type="number" value={row.getValue("trainingExpiry")} className="w-16 mr-2 text-center" />
				days
			</span>
		),
	},
	{
		accessorKey: "competencyExpiry",
		header: "until Expiry",
		cell: ({ row }) => (
			<span key={row.id}>
				<Input type="number" value={row.getValue("competencyExpiry")} className="w-16 mr-2 text-center" />
				days
			</span>
		),
	},
	{
		accessorKey: "competencyToTrainDuration",
		header: "to be Trainer",
		cell: ({ row }) => (
			<span key={row.id}>
				<Input type="number" value={row.getValue("competencyToTrainDuration")} className="w-16 mr-2 text-center" />
				days
			</span>
		),
	},
];

// This is a unique case where the table will not be re-used, as it's more complex than the others.
export default function NumbersPage() {
	// Sort rows so identical rideTier values are adjacent (required for rowSpan merging)
	const sorted = [...details].sort((a, b) => a.rideTier - b.rideTier || a.positionTier.localeCompare(b.positionTier));

	// Count how many rows each rideTier has (used for rowSpan)
	const tierCounts = sorted.reduce((acc: Record<number, number>, cur) => {
		acc[cur.rideTier] = (acc[cur.rideTier] || 0) + 1;
		return acc;
	}, {} as Record<number, number>);

	const table = useReactTable({ data: sorted, columns, getCoreRowModel: getCoreRowModel() });

	// Track which rideTiers we've already rendered the spanning cell for
	const renderedTiers = new Set<number>();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">NUMBER MATRIX</h1>
			<p className="font-normal italic">Define timings before and after competency</p>

			<div className="flex h-full p-4">
				<div className="overflow-hidden rounded-lg border shadow-lg w-full *:h-full">
					<Table className="text-lg h-full">
						<TableHeader>
							{table.getHeaderGroups().map(group => (
								<TableRow key={group.id}>
									{group.headers.map(header => (
										<TableHead key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => {
								const original = row.original as MatrixDetail;
								const showTier = !renderedTiers.has(original.rideTier);
								if (showTier) renderedTiers.add(original.rideTier);
								// Filter out the rideTier cell if it's a duplicate (we don't want to render an extra TD)
								const cellsToRender = row.getVisibleCells().filter(cell => !(cell.column.id === "rideTier" && !showTier));
								return (
									<TableRow key={row.id}>
										{cellsToRender.map(cell => (
											<TableCell key={cell.id} rowSpan={cell.column.id === "rideTier" ? tierCounts[original.rideTier] : 1}>
												{cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : String(cell.getValue())}
											</TableCell>
										)) }
									</TableRow>
								);
							}) : (
								<TableRow>
									<TableCell colSpan={columns.length}>No results...</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</main>
	);
}