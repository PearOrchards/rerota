import { Table } from "@/components/ui/table";

// This is a unique case where the table will not be re-used, as it's more complex than the others.
export default function NumbersPage() {
	return (
		<main className="px-16 py-12">
			<h1 className="font-semibold text-3xl">NUMBER MATRIX</h1>
			<p className="font-normal italic">Define timings before and after competency</p>

			<Table>

			</Table>
		</main>
	);
}