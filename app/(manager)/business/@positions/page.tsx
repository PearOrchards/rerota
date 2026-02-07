import { getPositions } from "@/lib/actions/positions";
import { PositionsTable } from "./PositionsTable";
import { PositionFormModal } from "./PositionFormModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function PositionsSection() {
	const positions = await getPositions();

	return (
		<div>
			<div className="flex justify-between">
				<div>
					<h2 className="text-lg font-semibold">POSITIONS</h2>
					<p className="font-light italic">Positions possible on a ride (task)</p>
				</div>
				<div className="mt-auto">
					<PositionFormModal
						trigger={
							<Button variant="ghost" size="icon">
								<Plus />
							</Button>
						}
					/>
				</div>
			</div>
			<PositionsTable positions={positions} />
			<p className="italics text-sm mt-1 italic text-gray-800 dark:text-gray-400">
				NOTE: Reordering positions here changes their order in other parts of the application. Changes are immediate.
			</p>
		</div>
	);
}