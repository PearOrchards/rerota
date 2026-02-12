import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/auth/crypto";

const MAGIC_LINK_TTL_MINUTES = Number(
	process.env.AUTH_MAGIC_LINK_TTL_MINUTES ?? 15,
);
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

type MagicLinkIdentity = {
	staffMemberId: string;
	email: string;
};

export async function createMagicLink(
	identity: MagicLinkIdentity,
	meta: { ip?: string | null; userAgent?: string | null },
) {
	const token = randomToken(32);
	const tokenHash = sha256(token);
	const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);

	await prisma.magicLink.create({
		data: {
			identityId: identity.staffMemberId,
			tokenHash,
			expiresAt,
			ip: meta.ip ?? null,
			userAgent: meta.userAgent ?? null,
		},
	});

	const link = new URL("/api/auth/callback", APP_URL);
	link.searchParams.set("token", token);

	return { link: link.toString(), expiresAt };
}

export async function consumeMagicLink(token: string) {
	const tokenHash = sha256(token);
	const now = new Date();

	return await prisma.$transaction(async tx => {
		const record = await tx.magicLink.findUnique({
			where: { tokenHash },
			include: {
				identity: {
					include: {
						role: true,
						staffMember: true,
					},
				},
			},
		});

		if (!record) {
			return null;
		}
		if (record.usedAt || record.expiresAt <= now) {
			return null;
		}
		if (record.identity.disabledAt) {
			return null;
		}

		await tx.magicLink.update({
			where: { id: record.id },
			data: { usedAt: now },
		});
		await tx.identity.update({
			where: { staffMemberId: record.identityId },
			data: { lastLoginAt: now },
		});

		return record.identity;
	});
}
