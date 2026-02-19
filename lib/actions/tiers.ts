"use server";

import { prisma } from "@/lib/prisma";
import { Tier } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { ModifyResponse } from "@/lib/types/common";
import { extractReadableErrorMessage } from "@/lib/utils";

export async function getTiers(): Promise<Tier[]> {
	const session = await requirePermission("tier:READ");
	return await prisma.tier.findMany({
		where: {
			businessId: { equals: session.businessId },
		},
		orderBy: {
			order: "asc",
		},
	});
}

export async function createTier(data: Tier): Promise<ModifyResponse> {
	const session = await requirePermission("tier:CREATE");
	const { name, order } = data;

	try {
		const newTier = await prisma.tier.create({
			data: {
				name,
				order,
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/tiers");
		return {
			success: !!newTier,
			message: "Tier created successfully.",
		};
	} catch (error) {
		console.error("Error creating tier:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updateTier(data: Tier): Promise<ModifyResponse> {
	const session = await requirePermission("tier:UPDATE");
	const { id, name, order } = data;

	try {
		const existing = await prisma.tier.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Tier not found.");
		}

		const updatedTier = await prisma.tier.update({
			where: { id },
			data: { name, order },
		});
		revalidatePath("/tiers");
		return {
			success: !!updatedTier,
			message: "Tier updated successfully.",
		};
	} catch (error) {
		console.error("Error updating tier:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updateTierOrders(tiers: Tier[]): Promise<ModifyResponse> {
	await requirePermission("tier:UPDATE");
	try {
		// Update each tier's order in a transaction
		await prisma.$transaction(
			tiers.map((tier, index) =>
				prisma.tier.update({
					where: { id: tier.id },
					data: { order: index + 1 },
				}),
			),
		);
		revalidatePath("/business");
		return {
			success: true,
			message: "Tier order updated successfully.",
		};
	} catch (error) {
		console.error("Error updating tier orders:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function deleteTier(id: string): Promise<ModifyResponse> {
	const session = await requirePermission("tier:DELETE");
	try {
		const existing = await prisma.tier.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Tier not found.");
		}

		await prisma.tier.delete({
			where: { id },
		});

		revalidatePath("/tiers");
		return {
			success: true,
			message: "Tier deleted successfully.",
		};
	} catch (error) {
		console.error("Error deleting tier:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
