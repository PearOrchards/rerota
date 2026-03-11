"use server";

import { prisma } from "@/lib/prisma";
import { Rota } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/rbac";

export async function getToday(): Promise<Rota | null> {
	const session = await requirePermission("rota:READ");
	const today = new Date();

	return await prisma.rota.findFirst({
		where: {
			businessId: session.businessId,
			applicableDate: today,
		},
	});
}