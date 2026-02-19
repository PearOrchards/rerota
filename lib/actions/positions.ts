"use server";

import { prisma } from "@/lib/prisma";
import { Position } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";

export async function getPositions(): Promise<Position[]> {
	const session = await requirePermission("position:READ");
	return await prisma.position.findMany({
		where: { businessId: session.businessId },
		orderBy: { order: "asc" },
	});
}

export async function createPosition(data: Position): Promise<boolean> {
	const session = await requirePermission("position:CREATE");
	const { id, businessId, ...rest } = data;

	try {
		const newPosition = await prisma.position.create({
			data: {
				...rest,
				business: {
					connect: { id: session.businessId },
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
	const session = await requirePermission("position:UPDATE");
	const { id, businessId, ...rest } = data;

	try {
		const existing = await prisma.position.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Position not found.");
		}

		const updatedPosition = await prisma.position.update({
			where: { id },
			data: { ...rest },
		});
		revalidatePath("/business");
		return !!updatedPosition;
	} catch (error) {
		console.error("Error updating position:", error);
		return false;
	}
}

export async function updatePositionOrders(positions: Position[]): Promise<boolean> {
	await requirePermission("position:UPDATE");
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
	const session = await requirePermission("position:DELETE");
	const existing = await prisma.position.findFirst({
		where: { id, businessId: session.businessId },
	});
	if (!existing) {
		throw new Error("Position not found.");
	}

	await prisma.numberMatrix.deleteMany({
		where: { positionId: id },
	});

	await prisma.position.delete({
		where: { id },
	});

	revalidatePath("/business");
	return true;
}
