import type { Ride } from "@/generated/prisma/client";
import { Client } from "./client";

import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

export async function getRides(): Promise<Ride[]> {
	const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";
	return await prisma.ride.findMany({
		where: {
			businessId: { equals: STATIC_BUSINESS_ID },
		},
		include: {
			tier: true,
		},
	});
}

export default function RidesPage() {
	const rides = getRides();

	return (
		<main className="px-16 py-12 flex flex-col w-full">
			<h1 className="font-semibold text-3xl">RIDES</h1>
			<p className="font-normal italic">The long list of all the rides.</p>

			<div className="flex p-4">
				<Suspense fallback={
					<div><Spinner /></div>
				}>
					<Client data={rides} />
				</Suspense>
			</div>
		</main>
	);
}