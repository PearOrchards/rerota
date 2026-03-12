import { use } from "react";
import { TodayRota } from "@/lib/actions/rotas";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export function History({ history }: { history: Promise<TodayRota[]> }) {
	const prior = use(history);

	return (
		<div className="grid grid-cols-3 gap-4 p-2 rounded-2xl bg-black/10">
			{ prior.map(rota => (
				<Link key={rota.id} href={`/rotas/${rota.id}`} className="text-center">
					<Button className="hover:cursor-pointer" variant="link">
						{ rota.applicableDate.toLocaleDateString() }
						<ExternalLink />
					</Button>
				</Link>
			)) }
		</div>
	);
}