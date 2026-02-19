"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import type { NumberMatrixTableData } from "@/lib/types/number-matrix";
import { ModifyResponse } from "@/lib/types/common";
import { extractReadableErrorMessage } from "@/lib/utils";

const categoryOrderByName: Record<string, number> = {
	"Training Required": 1,
	"Training Break until Lost": 2,
	"Competency Break until Lost": 3,
	"Competency until Trainer": 4,
};

export async function getNumberMatrixData(): Promise<NumberMatrixTableData> {
	const session = await requirePermission("numberMatrix:READ");

	const [tiers, positions, categories, matrix] = await Promise.all([
		prisma.tier.findMany({
			where: { businessId: session.businessId },
			orderBy: { order: "asc" },
		}),
		prisma.position.findMany({
			where: { businessId: session.businessId },
			orderBy: { order: "asc" },
		}),
		prisma.category.findMany({
			where: { businessId: session.businessId },
			orderBy: { name: "asc" },
		}),
		prisma.numberMatrix.findMany({
			where: {
				tier: { businessId: session.businessId },
				position: { businessId: session.businessId },
				category: { businessId: session.businessId },
			},
		}),
	]);

	const orderedCategories = [...categories].sort((a, b) => {
		const aOrder = categoryOrderByName[a.name] ?? Number.MAX_SAFE_INTEGER;
		const bOrder = categoryOrderByName[b.name] ?? Number.MAX_SAFE_INTEGER;
		if (aOrder !== bOrder) {
			return aOrder - bOrder;
		}
		return a.name.localeCompare(b.name);
	});

	const matrixByKey = new Map<string, number>();
	for (const entry of matrix) {
		matrixByKey.set(`${entry.tierId}:${entry.positionId}:${entry.categoryId}`, entry.time);
	}

	const rows = tiers.flatMap((tier, tierIndex) =>
		positions.map(position => {
			const values: Record<string, number> = {};
			for (const category of orderedCategories) {
				const key = `${tier.id}:${position.id}:${category.id}`;
				values[category.id] = matrixByKey.get(key) ?? 0;
			}
			return {
				tierId: tier.id,
				positionId: position.id,
				rideTier: tier.order || tierIndex + 1,
				positionTier: position.name,
				values,
			};
		}),
	);

	return {
		categories: orderedCategories.map(category => ({
			id: category.id,
			name: category.name,
		})),
		rows,
	};
}

export type NumberMatrixInput = {
	tierId: string;
	positionId: string;
	categoryId: string;
	time: number;
};

export async function updateNumberMatrixEntries(entries: NumberMatrixInput[]): Promise<ModifyResponse> {
	await requirePermission("numberMatrix:UPDATE");

	// Check all numbers are positive
	for (const entry of entries) {
		if (entry.time < 0) throw new Error("Time values must be positive.");
	}

	try {
		await prisma.$transaction(
			entries.map(entry =>
				prisma.numberMatrix.upsert({
					where: {
						tierId_positionId_categoryId: {
							tierId: entry.tierId,
							positionId: entry.positionId,
							categoryId: entry.categoryId,
						},
					},
					create: {
						tierId: entry.tierId,
						positionId: entry.positionId,
						categoryId: entry.categoryId,
						time: entry.time,
					},
					update: {
						time: entry.time,
					},
				}),
			),
		);
		revalidatePath("/numbers");
		return {
			success: true,
			message: "Number matrix updated successfully.",
		};
	} catch (error) {
		console.error("Error updating number matrix:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
