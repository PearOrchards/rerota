"use server";

import { prisma } from "@/lib/prisma";
import { Position } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { ModifyResponse } from "@/lib/types/common";
import { extractReadableErrorMessage } from "@/lib/utils";

export async function getPositions(): Promise<Position[]> {
	const session = await requirePermission("position:READ");
	return await prisma.position.findMany({
		where: { businessId: session.businessId },
		orderBy: { order: "asc" },
	});
}

export async function createPosition(data: Position): Promise<ModifyResponse> {
	const session = await requirePermission("position:CREATE");
	const { name, order } = data;

	try {
		const newPosition = await prisma.position.create({
			data: {
				name,
				order,
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/business");
		return {
			success: !!newPosition,
			message: "Position created successfully.",
		};
	} catch (error) {
		console.error("Error creating position:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updatePosition(data: Position): Promise<ModifyResponse> {
	const session = await requirePermission("position:UPDATE");
	const { id, name, order } = data;

	try {
		const existing = await prisma.position.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Position not found.");
		}

		const updatedPosition = await prisma.position.update({
			where: { id },
			data: { name, order },
		});
		revalidatePath("/business");
		return {
			success: !!updatedPosition,
			message: "Position updated successfully.",
		};
	} catch (error) {
		console.error("Error updating position:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updatePositionOrders(positions: Position[]): Promise<ModifyResponse> {
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
		return {
			success: true,
			message: "Position order updated successfully.",
		};
	} catch (error) {
		console.error("Error updating position orders:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function deletePosition(id: string): Promise<ModifyResponse> {
	const session = await requirePermission("position:DELETE");
	try {
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
		return {
			success: true,
			message: "Position deleted successfully.",
		};
	} catch (error) {
		console.error("Error deleting position:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
