import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/auth/crypto";
import { encryptAccessToken, encryptRefreshToken } from "@/lib/auth/jwt";

const ACCESS_TOKEN_TTL_MINUTES = Number(
	process.env.AUTH_ACCESS_TTL_MINUTES ?? 15,
);
const REFRESH_TOKEN_TTL_DAYS = Number(
	process.env.AUTH_REFRESH_TTL_DAYS ?? 30,
);

type IdentityWithRole = {
	staffMemberId: string;
	email: string;
	roleId: string;
	role: { name: string };
	staffMember: { businessId: string };
};

export async function issueAuthTokens(
	identity: IdentityWithRole,
	options?: { rotatedFromId?: string },
) {
	const now = new Date();
	const refreshExpiresAt = new Date(
		now.getTime() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
	);
	const accessExpiresAt = new Date(
		now.getTime() + ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
	);

	const jti = randomToken(16);
	const baseClaims = {
		sub: identity.staffMemberId,
		email: identity.email,
		roleId: identity.roleId,
		roleName: identity.role.name,
		businessId: identity.staffMember.businessId,
		jti,
	};

	const accessToken = await encryptAccessToken(baseClaims);
	const refreshToken = await encryptRefreshToken(baseClaims);

	await prisma.refreshToken.create({
		data: {
			identityId: identity.staffMemberId,
			jti,
			tokenHash: sha256(refreshToken),
			expiresAt: refreshExpiresAt,
			rotatedFromId: options?.rotatedFromId ?? null,
		},
	});

	return {
		accessToken,
		refreshToken,
		accessExpiresAt,
		refreshExpiresAt,
	};
}
