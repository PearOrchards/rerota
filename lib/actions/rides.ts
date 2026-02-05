"use server";

import { prisma } from "@/lib/prisma";
import type { RideWithExtra } from "@/lib/types/rides";
import { Ride, Tier } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";

export async function getRides(): Promise<RideWithExtra[]> {
	const rides = await prisma.ride.findMany({
		where: {
			businessId: { equals: STATIC_BUSINESS_ID },
		},
		include: {
			tier: true,
		},
	});

	return await Promise.all(
		rides.map(async (ride) => {
			const competenciesCount = await prisma.competency.count({
				where: { rideId: ride.id },
			});
			return {
				...ride,
				competenciesCount,
			};
		}),
	) as RideWithExtra[];
}

export async function getTiers(): Promise<Tier[]> {
	return await prisma.tier.findMany({
		where: {
			businessId: { equals: STATIC_BUSINESS_ID },
		},
	});
}

export async function createRide(data: Ride): Promise<boolean> {
	// validation
	const { id, tierId, businessId, ...createData } = data;

	try {
		const newRide = await prisma.ride.create({
			data: {
				...createData,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: businessId },
				},
			},
		});
		revalidatePath("/rides");
		return !!newRide;
	} catch (error) {
		console.error("Error creating ride:", error);
		return false;
	}
}

export async function updateRide(data: Ride): Promise<boolean> {
	const { id, tierId, businessId, ...rest } = data;

	// validation

	try {
		const updatedRide = await prisma.ride.update({
			where: { id },
			data: {
				...rest,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: businessId },
				},
			},
		});
		revalidatePath("/rides");
		return !!updatedRide;
	} catch (error) {
		console.error("Error updating ride:", error);
		return false;
	}
}

export async function deleteRide(id: string): Promise<boolean> {
	await prisma.ride.delete({
		where: { id },
	});

	revalidatePath("/rides");
	return true;
}