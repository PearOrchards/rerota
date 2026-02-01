import { Table } from "./table";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

import { getRides, getTiers } from "@/lib/actions/rides";

const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";

export default function RidesPage() {
	const rides = getRides();
	const tiers = getTiers();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">RIDES</h1>
			<p className="font-normal italic">The long list of all the rides.</p>

			<div className="flex p-4">
				<Suspense fallback={
					<div><Spinner /></div>
				}>
					<Table data={rides} tiers={tiers} businessId={STATIC_BUSINESS_ID} />
				</Suspense>
			</div>
		</main>
	);
}