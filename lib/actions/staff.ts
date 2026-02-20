"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { ModifyResponse } from "@/lib/types/common";
import { StaffMemberFormData, StaffMemberWithCompetencies } from "@/lib/types/staffMember";
import { extractReadableErrorMessage } from "@/lib/utils";

export async function getStaff(): Promise<StaffMemberWithCompetencies[]> {
	const session = await requirePermission("staffMember:READ");
	const staff = await prisma.staffMember.findMany({
		where: { businessId: session.businessId },
		orderBy: [
			{ lastName: "asc" },
			{ firstName: "asc" },
		],
	});

	return await Promise.all(
		staff.map(async (staffMember) => {
			const competenciesCount = await prisma.competency.count({
				where: { staffMemberId: staffMember.id },
			});
			return {
				...staffMember,
				competenciesCount,
			};
		}),
	);
}

export async function createStaffMember(data: StaffMemberFormData): Promise<ModifyResponse> {
	const session = await requirePermission("staffMember:CREATE");
	const { firstName, lastName } = data;

	try {
		const createdStaffMember = await prisma.staffMember.create({
			data: {
				firstName,
				lastName,
				business: {
					connect: { id: session.businessId },
				},
			},
		});
		revalidatePath("/staff");
		return {
			success: !!createdStaffMember,
			message: "Staff member created successfully.",
		};
	} catch (error) {
		console.error("Error creating staff member:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updateStaffMember(data: StaffMemberFormData): Promise<ModifyResponse> {
	const session = await requirePermission("staffMember:UPDATE");
	const { id, firstName, lastName } = data;

	try {
		const existing = await prisma.staffMember.findFirst({
			where: { id, businessId: session.businessId },
		});
		if (!existing) {
			throw new Error("Staff member not found.");
		}

		const updatedStaffMember = await prisma.staffMember.update({
			where: { id },
			data: {
				firstName,
				lastName,
			},
		});
		revalidatePath("/staff");
		return {
			success: !!updatedStaffMember,
			message: "Staff member updated successfully.",
		};
	} catch (error) {
		console.error("Error updating staff member:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function deleteStaffMember(id: string): Promise<ModifyResponse> {
	const session = await requirePermission("staffMember:DELETE");

	if (session.sub === id) {
		return {
			success: false,
			message: "You cannot delete yourself.",
		};
	}

	try {
		const existing = await prisma.staffMember.findFirst({
			where: { id, businessId: session.businessId },
			select: { id: true, identity: { select: { staffMemberId: true } } },
		});
		if (!existing) {
			throw new Error("Staff member not found.");
		}

		await prisma.$transaction(async (tx) => {
			await tx.competency.deleteMany({
				where: { staffMemberId: id },
			});

			if (existing.identity) {
				await tx.magicLink.deleteMany({
					where: { identityId: id },
				});
				await tx.refreshToken.deleteMany({
					where: { identityId: id },
				});
				await tx.identity.delete({
					where: { staffMemberId: id },
				});
			}

			await tx.staffMember.delete({
				where: { id },
			});
		});

		revalidatePath("/staff");
		return {
			success: true,
			message: "Staff member deleted successfully.",
		};
	} catch (error) {
		console.error("Error deleting staff member:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
