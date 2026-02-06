import { getTiers } from "@/lib/actions/tiers";
import { TiersTable } from "./TiersTable";
import { TierFormModal } from "@/app/(manager)/business/@tiers/TierFormModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TiersSection() {
	const tiers = await getTiers();
	console.log(tiers);

	return (
		<div>
			<div className="flex justify-between">
				<div>
					<h2 className="text-lg font-semibold">TIERS</h2>
					<p className="font-light italic">Represents the complexity of a ride (task), broken down further by positions.</p>
				</div>
				<div className="mt-auto">
					<TierFormModal
						trigger={
							<Button variant="ghost" size="icon">
								<Plus />
							</Button>
						}
					/>
				</div>
			</div>

			<TiersTable tiers={tiers} />
			<p className="italics text-sm mt-1 italic text-gray-800 dark:text-gray-400">
				NOTE: Reordering tiers here changes their order in other parts of the application. Changes are immediate.
			</p>
		</div>
	);
}