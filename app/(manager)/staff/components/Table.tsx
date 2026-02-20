"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { StaffMemberWithCompetencies } from "@/lib/types/staffMember";
import { Actions } from "./Actions";

interface TableProps {
	data: StaffMemberWithCompetencies[];
	businessId: string;
}

const createColumns = (
	businessId: string,
): ColumnDef<StaffMemberWithCompetencies>[] => [
	{
		header: "Name",
		cell: ({ row }) => (
			<span>{row.original.firstName} {row.original.lastName}</span>
		),
	},
	{
		header: "Competencies",
		cell: ({ row }) => (
			<span>{row.original.competenciesCount}</span>
		),
	},
	{
		id: "actions",
		header: "",
		cell: ({ row }) => (
			<Actions staffMember={row.original} businessId={businessId} />
		),
	},
];

export function Table({ data, businessId }: TableProps) {
	const columns = createColumns(businessId);

	return (
		<div className="space-y-4 w-full">
			<DataTable data={data} columns={columns} />
		</div>
	);
}
