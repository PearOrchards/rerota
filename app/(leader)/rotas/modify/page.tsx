import { redirect } from "next/navigation";
import { getOrCreateTodayRotaId } from "@/lib/actions/rotas";

export default async function RotaModifyPage() {
	const rotaId = await getOrCreateTodayRotaId();
	redirect(`/rotas/modify/${rotaId}`);
}
