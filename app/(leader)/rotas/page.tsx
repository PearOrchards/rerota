import { requireSession } from "@/lib/auth/session";
import { getToday } from "@/lib/actions/rotas";

export default async function RotasPage() {
	const session = await requireSession();
	const todaysRota = await getToday();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="flex flex-row justify-between">
				<div>
					<h1 className="font-semibold text-3xl">ROTAS</h1>
					<p className="font-normal italic">Who&#39;s doing what today?</p>
				</div>
				<div className="mt-auto">
				</div>
			</div>

			<div className="flex py-4">
				{ todaysRota ? (
					<p>Seems like a rota is in progress!</p>
				) : (
					<p>No rota made yet.</p>
				)}
			</div>
		</main>
	);
}