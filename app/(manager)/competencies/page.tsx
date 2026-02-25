import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCompetencies, getCompetencyCreateContext } from "@/lib/actions/competencies";
import { CompetencyFormModal } from "./components/CompetencyFormModal";
import { Table } from "./components/Table";

export default async function CompetenciesPage() {
	const [competencies, createContext] = await Promise.all([
		getCompetencies(),
		getCompetencyCreateContext(),
	]);
	const canCreateCompetency = createContext.staff.length > 0
		&& createContext.rides.some((ride) => ride.positions.length > 0);

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="flex flex-row justify-between">
				<div>
					<h1 className="font-semibold text-3xl">COMPETENCIES</h1>
					<p className="font-normal italic">
						The long list of staff, rides, and positions showing when competency expires.
					</p>
				</div>
				<div className="mt-auto">
					<CompetencyFormModal
						availableStaff={createContext.staff}
						availableRides={createContext.rides}
						trigger={(
							<Button disabled={!canCreateCompetency}>
								<Plus /> New Competency
							</Button>
						)}
					/>
				</div>
			</div>

			<div className="flex py-4">
				{competencies.length
					? <Table data={competencies} />
					: (
						<div className="w-full rounded-lg border p-6 shadow-lg bg-background">
							<p className="font-medium">No competencies exist yet.</p>
							{!canCreateCompetency && (
								<p className="text-sm text-muted-foreground mt-2">
									Create staff, rides, and ride positions before adding competencies.
								</p>
							)}
						</div>
					)
				}
			</div>
		</main>
	);
}
