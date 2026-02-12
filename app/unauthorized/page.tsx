import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center">
			<div className="max-w-lg rounded-2xl border bg-neutral-950 px-8 py-6 shadow-lg text-center">
				<h1 className="text-3xl font-semibold">ACCESS DENIED</h1>
				<p className="italic">
					You do not have permission to view this page.
				</p>
				<Button className="mt-4">
					<Link href={"/"}>Return Home</Link>
				</Button>
			</div>
		</main>
	);
}
