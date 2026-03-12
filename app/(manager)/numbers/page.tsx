import NumbersTable from "@/app/(manager)/numbers/NumbersTable";
import { getNumberMatrixData } from "@/lib/actions/numberMatrix";

export default async function NumbersPage() {
	const data = await getNumberMatrixData();
	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">NUMBER MATRIX</h1>
			<p className="font-normal italic">Define timings before and after competency</p>
			<NumbersTable categories={data.categories} rows={data.rows} />
		</main>
	);
}
