import { Table } from "./components/Table";
import { RideFormModal } from "./components/RideFormModal";

import { getRides } from "@/lib/actions/rides";
import { getTiers } from "@/lib/actions/tiers";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";

export default async function RidesPage() {
	const session = await requireSession();
	const rides = await getRides();
	const tiers = await getTiers();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="flex flex-row justify-between">
				<div>
					<h1 className="font-semibold text-3xl">RIDES</h1>
					<p className="font-normal italic">The long list of all the rides.</p>
				</div>
				<div className="mt-auto">
					<RideFormModal
						trigger={
							<Button>
								<Plus /> New Ride
							</Button>
						}
						availableTiers={tiers}
						businessId={session.businessId}
					/>
				</div>
			</div>

			<div className="flex py-4">
				<Table data={rides} tiers={tiers} businessId={session.businessId} />
			</div>
		</main>
	);
}
