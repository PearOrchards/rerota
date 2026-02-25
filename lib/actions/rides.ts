"use server";

import { prisma } from "@/lib/prisma";
import type { RideFormData, RidePositionQuantity, RideWithExtra } from "@/lib/types/rides";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { ModifyResponse } from "@/lib/types/common";
import { extractReadableErrorMessage } from "@/lib/utils";

function normalizeRoleQuantities(roleQuantities: RidePositionQuantity[]): RidePositionQuantity[] {
	const normalizedByPositionId = new Map<string, number>();

	for (const roleQuantity of roleQuantities) {
		const positionId = roleQuantity.positionId;
		const quantity = Math.max(0, Math.floor(Number(roleQuantity.quantity) || 0));
		if (!positionId || !quantity) {
			continue;
		}
		normalizedByPositionId.set(positionId, quantity);
	}

	return Array.from(normalizedByPositionId, ([positionId, quantity]) => ({ positionId, quantity }));
}

export async function getRides(): Promise<RideWithExtra[]> {
	const session = await requirePermission("ride:READ");
	const rides = await prisma.ride.findMany({
		where: {
			businessId: { equals: session.businessId },
		},
		include: {
			tier: true,
			ridePositions: {
				include: {
					position: true,
				},
				orderBy: {
					position: {
						order: "asc",
					},
				},
			},
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
	);
}

export async function createRide(data: RideFormData): Promise<ModifyResponse> {
	const session = await requirePermission("ride:CREATE");
	const { tierId, name, description, positionQuantities } = data;
	const normalizedRoleQuantities = normalizeRoleQuantities(positionQuantities);
	const uniquePositionIds = normalizedRoleQuantities.map((roleQuantity) => roleQuantity.positionId);

	try {
		if (!normalizedRoleQuantities || normalizedRoleQuantities.length < 1) {
			throw new Error("Select at least one role for this ride.");
		}

		const tier = await prisma.tier.findFirst({
			where: { id: tierId, businessId: session.businessId },
			select: { id: true },
		});
		if (!tier) {
			throw new Error("Selected tier is not available for this business.");
		}

		const positions = await prisma.position.findMany({
			where: {
				id: { in: uniquePositionIds },
				businessId: session.businessId,
			},
			select: { id: true },
		});
		if (positions.length !== uniquePositionIds.length) {
			throw new Error("One or more selected roles are invalid.");
		}

		const newRide = await prisma.ride.create({
			data: {
				name,
				description: description || null,
				tier: {
					connect: { id: tierId },
				},
				ridePositions: {
					create: normalizedRoleQuantities.map(({ positionId, quantity }) => ({
						positionId,
						quantity,
					})),
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

export async function updateRide(data: RideFormData): Promise<ModifyResponse> {
	const session = await requirePermission("ride:UPDATE");
	const { id, tierId, name, description, positionQuantities } = data;
	const normalizedRoleQuantities = normalizeRoleQuantities(positionQuantities);
	const uniquePositionIds = normalizedRoleQuantities.map((roleQuantity) => roleQuantity.positionId);

	try {
		if (!normalizedRoleQuantities || normalizedRoleQuantities.length < 1) {
			throw new Error("Select at least one role for this ride.");
		}

		const existing = await prisma.ride.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Ride not found.");
		}

		const tier = await prisma.tier.findFirst({
			where: { id: tierId, businessId: session.businessId },
			select: { id: true },
		});
		if (!tier) {
			throw new Error("Selected tier is not available for this business.");
		}

		const positions = await prisma.position.findMany({
			where: {
				id: { in: uniquePositionIds },
				businessId: session.businessId,
			},
			select: { id: true },
		});
		if (positions.length !== uniquePositionIds.length) {
			throw new Error("One or more selected roles are invalid.");
		}

		const updatedRide = await prisma.ride.update({
			where: { id },
			data: {
				name,
				description: description || null,
				tier: {
					connect: { id: tierId },
				},
				ridePositions: {
					deleteMany: {},
					create: normalizedRoleQuantities.map((roleQuantity) => ({
						positionId: roleQuantity.positionId,
						quantity: roleQuantity.quantity,
					})),
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
