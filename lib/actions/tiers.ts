"use server";

import { prisma } from "@/lib/prisma";
import { Tier } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";

export async function getTiers(): Promise<Tier[]> {
	return await prisma.tier.findMany({
		where: {
			businessId: { equals: STATIC_BUSINESS_ID },
		},
		orderBy: {
			order: "asc",
		},
	});
}

export async function createTier(data: Tier): Promise<boolean> {
	const { id, businessId, ...createData } = data;

	try {
		const newTier = await prisma.tier.create({
			data: {
				...createData,
				business: {
					connect: { id: businessId },
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
	const { id, businessId, ...rest } = data;

	try {
		const updatedTier = await prisma.tier.update({
			where: { id },
			data: {
				...rest,
				business: {
					connect: { id: businessId },
				},
			},
		});
		revalidatePath("/tiers");
		return !!updatedTier;
	} catch (error) {
		console.error("Error updating tier:", error);
		return false;
	}
}

export async function updateTierOrders(tiers: Tier[]): Promise<boolean> {
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
	await prisma.tier.delete({
		where: { id },
	});

	revalidatePath("/tiers");
	return true;
}