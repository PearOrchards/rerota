"use server";

import { prisma } from "@/lib/prisma";
import type { RideWithExtra } from "@/lib/types/rides";
import { Ride } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { ModifyResponse } from "@/lib/types/common";
import { extractReadableErrorMessage } from "@/lib/utils";

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

export async function createRide(data: Ride): Promise<ModifyResponse> {
	// validation
	const session = await requirePermission("ride:CREATE");
	const { tierId, name, description } = data;

	try {
		const newRide = await prisma.ride.create({
			data: {
				name,
				description,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/rides");
		return {
			success: !!newRide,
			message: "Ride created successfully.",
		};
	} catch (error) {
		console.error("Error creating ride:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updateRide(data: Ride): Promise<ModifyResponse> {
	const session = await requirePermission("ride:UPDATE");
	const { id, tierId, name, description } = data;

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
				name,
				description,
				tier: {
					connect: { id: tierId },
				},
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/rides");
		return {
			success: !!updatedRide,
			message: "Ride updated successfully.",
		};
	} catch (error) {
		console.error("Error updating ride:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function deleteRide(id: string): Promise<ModifyResponse> {
	const session = await requirePermission("ride:DELETE");
	try {
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
		return {
			success: true,
			message: "Ride deleted successfully.",
		};
	} catch (error) {
		console.error("Error deleting ride:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
