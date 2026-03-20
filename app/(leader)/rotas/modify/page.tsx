import { getPositions } from "@/lib/actions/positions";
import { getRides } from "@/lib/actions/rides";
import { getCompetencies } from "@/lib/actions/competencies";
import { getStaff } from "@/lib/actions/staff";
import { getToday } from "@/lib/actions/rotas";
import RotaTable from "./RotaTable";

export default async function RotaModifyPage() {
	const [positions, rides, competencies, staff, todayRota] = await Promise.all([
		getPositions(),
		getRides(),
		getCompetencies(),
		getStaff(),
		getToday(),
	]);

	const initialAssignments = todayRota?.details.reduce<Record<string, string[]>>((acc, detail) => {
		const key = `${detail.rideId}:${detail.positionId}`;
		acc[key] = [...(acc[key] ?? []), detail.staffMemberId];
		return acc;
	}, {}) ?? {};

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
				initialState={initialAssignments}
			/>
		</main>
	);
}
