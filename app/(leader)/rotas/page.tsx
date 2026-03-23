import { requireSession } from "@/lib/auth/session";
import { getPreviousRotas, getToday } from "@/lib/actions/rotas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { RotaStatus } from "@/generated/prisma/client";
import { Suspense } from "react";
import { History } from "./History";
import { Spinner } from "@/components/ui/spinner";

function TodayRotaBox({
	rotaId,
	rotaStatus,
}: {
  rotaId: string | null;
  rotaStatus: RotaStatus | null;
}) {
	const draftLink = rotaId ? `/rotas/view/${rotaId}` : "/rotas/modify";
	const viewLink = rotaId ? `/rotas/view/${rotaId}` : "/rotas";

	switch (rotaStatus) {
		case RotaStatus.DRAFT:
			return (
				<div className="bg-zinc-600 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
					<div>
						<h2 className="font-semibold text-2xl">ROTA IN PROGRESS</h2>
						<p className="italic">Click on the arrow on the right to <b>continue</b>.</p>
					</div>
					<div>
						<Link href={draftLink} className="flex">
							<Button variant="link" className="hover:cursor-pointer">
								<ArrowRight className="size-8" />
							</Button>
						</Link>
					</div>
				</div>
			);

		case RotaStatus.READY:
			return (
				<div className="bg-green-600 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
					<div>
						<h2 className="font-semibold text-2xl">ROTA READY</h2>
						<p className="italic">Click on the arrow on the right to <b>review</b>.</p>
					</div>
					<div>
						<Link href={viewLink} className="flex">
							<Button variant="link" className="hover:cursor-pointer">
								<ArrowRight className="size-8" />
							</Button>
						</Link>
					</div>
				</div>
			);

		case RotaStatus.ACTIVE:
			return (
				<div className="bg-green-600 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
					<div>
						<h2 className="font-semibold text-2xl">ROTA DEPLOYED</h2>
						<p className="italic">Click on the arrow on the right to <b>review</b>.</p>
					</div>
					<div>
						<Link href={viewLink} className="flex">
							<Button variant="link" className="hover:cursor-pointer">
								<ArrowRight className="size-8" />
							</Button>
						</Link>
					</div>
				</div>
			);

		case RotaStatus.ARCHIVED:
			return (
				<div className="bg-zinc-600 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
					<div>
						<h2 className="font-semibold text-2xl">ROTA DONE</h2>
						<p className="italic">Click on the arrow on the right to <b>review</b>.</p>
					</div>
					<div>
						<Link href={viewLink} className="flex">
							<Button variant="link" className="hover:cursor-pointer">
								<ArrowRight className="size-8" />
							</Button>
						</Link>
					</div>
				</div>
			);

		default:
			return (
				<div className="bg-zinc-700 w-full p-4 rounded-2xl flex flex-row justify-between items-center">
					<div>
						<h2 className="font-semibold text-2xl">NO ROTA TODAY</h2>
						<p className="italic">Click on the arrow on the right to <b>start</b>.</p>
					</div>
					<div>
						<Link href={"/rotas/modify"} className="flex">
							<Button variant="link" className="hover:cursor-pointer">
								<ArrowRight className="size-8" />
							</Button>
						</Link>
					</div>
				</div>
			);
	}
}

export default async function RotasPage() {
	const todaysRota = await getToday();
	const historyPromise = getPreviousRotas();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<div className="flex flex-row justify-between">
				<div>
					<h1 className="font-semibold text-3xl">ROTAS</h1>
					<p className="font-normal italic">Who&#39;s doing what today?</p>
				</div>
				<div className="mt-auto"></div>
			</div>

			<div className="flex flex-col py-6">
				<TodayRotaBox
					rotaId={todaysRota?.id ?? null}
					rotaStatus={todaysRota?.status ?? null}
				/>
			</div>

			<div className="flex flex-col py-4">
				<h2 className="mb-2 font-semibold text-xl">History:</h2>
				<Suspense fallback={<Spinner />}>
					<History history={historyPromise} />
				</Suspense>
			</div>
		</main>
	);
}
