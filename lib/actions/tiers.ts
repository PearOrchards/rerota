"use server";

import { prisma } from "@/lib/prisma";
import { Tier } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";

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

export async function createTier(data: Tier): Promise<boolean> {
	const session = await requirePermission("tier:CREATE");
	const { id, businessId, ...createData } = data;

	try {
		const newTier = await prisma.tier.create({
			data: {
				...createData,
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/tiers");
		return !!newTier;
	} catch (error) {
		console.error("Error creating tier:", error);
		return false;
	}
}

export async function updateTier(data: Tier): Promise<boolean> {
	const session = await requirePermission("tier:UPDATE");
	const { id, businessId, ...rest } = data;

	try {
		const existing = await prisma.tier.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Tier not found.");
		}

		const updatedTier = await prisma.tier.update({
			where: { id },
			data: { ...rest },
		});
		revalidatePath("/tiers");
		return !!updatedTier;
	} catch (error) {
		console.error("Error updating tier:", error);
		return false;
	}
}

export async function updateTierOrders(tiers: Tier[]): Promise<boolean> {
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
		return true;
	} catch (error) {
		console.error("Error updating tier orders:", error);
		return false;
	}
}

export async function deleteTier(id: string): Promise<boolean> {
	const session = await requirePermission("tier:DELETE");
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
	return true;
}
