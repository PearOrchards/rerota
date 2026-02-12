"use server";

import { prisma } from "@/lib/prisma";
import type { RideWithExtra } from "@/lib/types/rides";
import { Ride } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";

export async function getRides(): Promise<RideWithExtra[]> {
	const session = await requirePermission("ride:READ");
	const rides = await prisma.ride.findMany({
		where: {
			businessId: { equals: session.businessId },
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

export async function createRide(data: Ride): Promise<boolean> {
	// validation
	const session = await requirePermission("ride:CREATE");
	const { id, tierId, businessId, ...createData } = data;

	try {
		const newRide = await prisma.ride.create({
			data: {
				...createData,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: session.businessId },
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
	const session = await requirePermission("ride:UPDATE");
	const { id, tierId, businessId, ...rest } = data;

	// validation

	try {
		const existing = await prisma.ride.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Ride not found.");
		}

		const updatedRide = await prisma.ride.update({
			where: { id },
			data: {
				...rest,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: session.businessId },
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
	const session = await requirePermission("ride:DELETE");
	const existing = await prisma.ride.findFirst({
		where: { id, businessId: session.businessId },
	});
	if (!existing) {
		throw new Error("Ride not found.");
	}

	await prisma.ride.delete({
		where: { id },
	});

	revalidatePath("/rides");
	return true;
}
