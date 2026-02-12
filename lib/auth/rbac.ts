import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import type { SessionClaims } from "@/lib/auth/jwt";
import { roleAllows } from "@/lib/auth/roles";

export async function requirePermission(permission: string): Promise<SessionClaims> {
	const session = await requireSession();
	if (roleAllows(session.roleName, "Admin")) {
		return session;
	}

	const role = await prisma.role.findUnique({
		where: { id: session.roleId },
		select: { permissions: { select: { slug: true } } },
	});

	if (!role?.permissions?.some(perm => perm.slug === permission)) {
		throw new Error("Forbidden");
	}
	return session;
}
