"use server";

import { prisma } from "@/lib/prisma";
import { Position } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

const STATIC_BUSINESS_ID = "a18dee1a-370c-42a1-b731-fbc1788c0815";

export async function getPositions(): Promise<Position[]> {
	return await prisma.position.findMany({
		where: { businessId: STATIC_BUSINESS_ID },
		orderBy: { order: "asc" },
	});
}

export async function createPosition(data: Position): Promise<boolean> {
	const { id, businessId, ...rest } = data;

	try {
		const newPosition = await prisma.position.create({
			data: {
				...rest,
				business: {
					connect: { id: STATIC_BUSINESS_ID },
				},
			},
		});
		revalidatePath("/business");
		return !!newPosition;
	} catch (error) {
		console.error("Error creating position:", error);
		return false;
	}
}

export async function updatePosition(data: Position): Promise<boolean> {
	const { id, businessId, ...rest } = data;

	try {
		const updatedPosition = await prisma.position.update({
			where: { id },
			data: {
				...rest,
				business: {
					connect: { id: businessId },
				},
			},
		});
		revalidatePath("/business");
		return !!updatedPosition;
	} catch (error) {
		console.error("Error updating position:", error);
		return false;
	}
}

export async function updatePositionOrders(positions: Position[]): Promise<boolean> {
	try {
		await prisma.$transaction(
			positions.map((position, index) =>
				prisma.position.update({
					where: { id: position.id },
					data: { order: index + 1 },
				}),
			),
		);
		revalidatePath("/business");
		return true;
	} catch (error) {
		console.error("Error updating position orders:", error);
		return false;
	}
}

export async function deletePosition(id: string): Promise<boolean> {
	await prisma.position.delete({
		where: { id },
	});

	revalidatePath("/business");
	return true;
}

