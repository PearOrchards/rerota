"use client";

import { useMemo, useState } from "react";
import { CellContext, ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { NumberMatrixTableData } from "@/lib/types/number-matrix";
import { updateNumberMatrixEntries } from "@/lib/actions/number-matrix";

type ClientRow = {
	tierId: string;
	positionId: string;
	rideTier: number;
	positionTier: string;
	values: Record<string, string>;
};

const columnLabelByCategoryName: Record<string, string> = {
	"Training Required": "Duration of",
	"Training Break until Lost": "until Expiry",
	"Competency Break until Lost": "until Expiry",
	"Competency until Trainer": "to be Trainer",
};

const unitByCategoryName: Record<string, string> = {
	"Training Required": "hours",
	"Training Break until Lost": "days",
	"Competency Break until Lost": "days",
	"Competency until Trainer": "days",
};

export default function NumbersTable({ categories, rows }: NumberMatrixTableData) {
	const [draftRows, setDraftRows] = useState<ClientRow[]>(
		rows.map(row => ({
			...row,
			values: Object.fromEntries(
				categories.map(category => [
					category.id,
					String(row.values[category.id] ?? 0),
				]),
			),
		})),
	);
	const [isSaving, setIsSaving] = useState(false);

	const columns = useMemo<ColumnDef<ClientRow, unknown>[]>(() => {
		return [
			{
				accessorKey: "rideTier",
				header: "Ride Tier",
				cell: ({ row }) => (
					<div key={row.id} className="font-black">{row.getValue("rideTier")}</div>
				),
			},
			{
				accessorKey: "positionTier",
				header: "Position Tier",
				cell: ({ row }) => (
					<div key={row.id} className="font-semibold">{row.getValue("positionTier")}</div>
				),
			},
			...categories.map(category => ({
				id: category.id,
				header: columnLabelByCategoryName[category.name] ?? category.name,
				cell: ({ row }: CellContext<ClientRow, unknown>) => {
					const value = row.original.values[category.id] ?? "";
					return (
						<span key={`${row.id}-${category.id}`}>
							<Input
								type="number"
								value={value}
								onChange={event => {
									const nextValue = event.target.value;
									setDraftRows(prev => prev.map(item => {
										if (item.tierId !== row.original.tierId || item.positionId !== row.original.positionId) {
											return item;
										}
										return {
											...item,
											values: {
												...item.values,
												[category.id]: nextValue,
											},
										};
									}));
								}}
								className="w-16 mr-2 text-center"
							/>
							{unitByCategoryName[category.name] ?? ""}
						</span>
					);
				},
			})),
		];
	}, [categories]);

	const sortedRows = useMemo(
		() => [...draftRows].sort((a, b) => a.rideTier - b.rideTier || a.positionTier.localeCompare(b.positionTier)),
		[draftRows],
	);

	const table = useReactTable({ data: sortedRows, columns, getCoreRowModel: getCoreRowModel() });

	const tierCounts = useMemo(() => {
		return sortedRows.reduce((acc: Record<number, number>, cur) => {
			acc[cur.rideTier] = (acc[cur.rideTier] || 0) + 1;
			return acc;
		}, {} as Record<number, number>);
	}, [sortedRows]);

	const renderedTiers = new Set<number>();

	const handleSave = async () => {
		setIsSaving(true);
		try {
			const payload = draftRows.flatMap(row =>
				categories.map(category => ({
					tierId: row.tierId,
					positionId: row.positionId,
					categoryId: category.id,
					time: Number.parseInt(row.values[category.id] ?? "0", 10) || 0,
				})),
			);
			await updateNumberMatrixEntries(payload);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col h-full py-4">
			<div className="overflow-hidden rounded-lg border shadow-lg w-full h-full *:h-full">
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
							const original = row.original;
							const showTier = !renderedTiers.has(original.rideTier);
							if (showTier) renderedTiers.add(original.rideTier);
							const cellsToRender = row.getVisibleCells().filter(cell => !(cell.column.id === "rideTier" && !showTier));
							return (
								<TableRow key={row.id}>
									{cellsToRender.map(cell => (
										<TableCell key={cell.id} rowSpan={cell.column.id === "rideTier" ? tierCounts[original.rideTier] : 1}>
											{cell.column.columnDef.cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : String(cell.getValue())}
										</TableCell>
									))}
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
			<div className="flex justify-end mt-4">
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	);
}
