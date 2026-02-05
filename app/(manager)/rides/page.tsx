import { Table } from "./components/Table";
import { RideFormModal } from "./components/RideFormModal";

import { getRides, getTiers } from "@/lib/actions/rides";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";

export default async function RidesPage() {
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
						businessId={STATIC_BUSINESS_ID}
					/>
				</div>
			</div>

			<div className="flex py-4">
				<Table data={rides} tiers={tiers} businessId={STATIC_BUSINESS_ID} />
			</div>
		</main>
	);
}