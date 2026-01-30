"use server";
import { prisma } from "@/lib/prisma";

export async function getRides() {
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