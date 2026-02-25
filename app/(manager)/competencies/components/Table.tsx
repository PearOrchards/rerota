"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import type { CompetencyWithExpiry } from "@/lib/types/competency";
import { Actions } from "./Actions";

interface TableProps {
	data: CompetencyWithExpiry[];
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	year: "numeric",
	month: "short",
	day: "2-digit",
	timeZone: "UTC",
});

function formatDate(date: Date | null): string {
	if (!date) {
		return "N/A";
	}

	return dateFormatter.format(date);
}

function getStatusClassName(status: CompetencyWithExpiry["status"]): string {
	if (status === "Expired") {
		return "text-red-600 dark:text-red-400 font-medium";
	}
	if (status === "Expiring soon") {
		return "text-amber-600 dark:text-amber-400 font-medium";
	}
	if (status === "Current") {
		return "text-emerald-600 dark:text-emerald-400 font-medium";
	}
	return "text-zinc-500 dark:text-zinc-400";
}

const columns: ColumnDef<CompetencyWithExpiry>[] = [
	{
		accessorKey: "staffMemberName",
		header: "Staff",
	},
	{
		accessorKey: "rideName",
		header: "Ride",
	},
	{
		accessorKey: "positionName",
		header: "Position",
	},
	{
		accessorKey: "tierName",
		header: "Tier",
	},
	{
		accessorKey: "achievedAt",
		header: "Achieved",
		cell: ({ row }) => (
			<span>{formatDate(row.original.achievedAt)}</span>
		),
	},
	{
		accessorKey: "lastRotatedAt",
		header: "Last Rotated",
		cell: ({ row }) => (
			<span>{formatDate(row.original.lastRotatedAt)}</span>
		),
	},
	{
		accessorKey: "expiresAt",
		header: "Expires",
		cell: ({ row }) => (
			<span>{formatDate(row.original.expiresAt)}</span>
		),
	},
	{
		accessorKey: "daysRemaining",
		header: "Days Left",
		cell: ({ row }) => {
			const daysRemaining = row.original.daysRemaining;
			if (daysRemaining === null) {
				return <span>N/A</span>;
			}
			if (daysRemaining < 0) {
				return <span>{Math.abs(daysRemaining)} overdue</span>;
			}
			return <span>{daysRemaining}</span>;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<span className={getStatusClassName(row.original.status)}>
				{row.original.status}
			</span>
		),
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<Actions competency={row.original} />
		),
	},
];

export function Table({ data }: TableProps) {
	return (
		<div className="space-y-4 w-full">
			<DataTable data={data} columns={columns} />
		</div>
	);
}
