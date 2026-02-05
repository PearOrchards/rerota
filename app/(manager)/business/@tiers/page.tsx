import { getTiers } from "@/lib/actions/rides";
import { TiersTable } from "./TiersTable";

export default async function TiersSection() {
	const tiers = await getTiers();

	return (
		<div>
			<h2 className="text-lg font-semibold">TIERS</h2>
			<p className="font-light italic">Represents the complexity of a ride (task), broken down further by positions.</p>

			<TiersTable tiers={tiers} />
		</div>
	);
}