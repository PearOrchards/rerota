import { notFound, redirect } from "next/navigation";
import { getPositions } from "@/lib/actions/positions";
import { getRides } from "@/lib/actions/rides";
import { getCompetencies } from "@/lib/actions/competencies";
import { getStaff } from "@/lib/actions/staff";
import { getRotaById } from "@/lib/actions/rotas";
import { RotaStatus } from "@/generated/prisma/client";
import RotaTable from "../RotaTable";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RotaModifyByIdPage({ params }: PageProps) {
	const { id } = await params;
	const [positions, rides, competencies, staff, rota] = await Promise.all([
		getPositions(),
		getRides(),
		getCompetencies(),
		getStaff(),
		getRotaById(id),
	]);

	if (!rota) {
		notFound();
	}

	if (rota.status !== RotaStatus.DRAFT) {
		redirect(`/rotas/view/${rota.id}`);
	}

	const initialAssignments = rota.details.reduce<Record<string, string[]>>(
		(acc, detail) => {
			const key = `${detail.rideId}:${detail.positionId}`;
			acc[key] = [...(acc[key] ?? []), detail.staffMemberId];
			return acc;
		},
		{},
	);

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="mb-2">
				<h1 className="font-semibold text-3xl">ROTA MANAGEMENT</h1>
			</div>
			<RotaTable
				positions={positions}
				rides={rides}
				competencies={competencies}
				staff={staff}
				rotaId={rota.id}
				initialState={initialAssignments}
			/>
		</main>
	);
}
