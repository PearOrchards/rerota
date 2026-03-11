import { requireSession } from "@/lib/auth/session";
import { getToday } from "@/lib/actions/rotas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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

			<div className="flex flex-col py-6">
				{ todaysRota ? (
					<div className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
						Seems like a rota is in progress!
					</div>
				) : (

					<div className="bg-zinc-700 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
						<div>
							<h2 className="font-semibold text-2xl">NO ROTA TODAY</h2>
							<p className="italic">Click on the arrow on the right to start.</p>
						</div>
						<div>
							<Link href={"/rotas/modify"} className="flex">
								<Button variant="link" className="hover:cursor-pointer">
									<ArrowRight className="size-8" />
								</Button>
							</Link>
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-col py-4">
				<h2 className="mb-2 font-semibold text-xl">History:</h2>
			</div>
		</main>
	);
}