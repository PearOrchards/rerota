import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/auth/crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { decryptAccessToken, decryptRefreshToken, type SessionClaims } from "@/lib/auth/jwt";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

export async function getSession(): Promise<SessionClaims | null> {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

	if (accessToken) {
		try {
			return await decryptAccessToken(accessToken);
		} catch {
			// Fallback to refresh token below.
		}
	}

	const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
	if (!refreshToken) {
		return null;
	}

	return await getSessionFromRefreshToken(refreshToken);
}

export async function requireSession(): Promise<SessionClaims> {
	const session = await getSession();
	if (!session) {
		throw new Error("Unauthorized");
	}
	return session;
}

export async function getSessionFromRequest(
	request: NextRequest,
): Promise<SessionClaims | null> {
	const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

	if (accessToken) {
		try {
			return await decryptAccessToken(accessToken);
		} catch {
			// Fallback to refresh token below.
		}
	}

	const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
	if (!refreshToken) {
		return null;
	}

	return await getSessionFromRefreshToken(refreshToken);
}

async function getSessionFromRefreshToken(refreshToken: string): Promise<SessionClaims | null> {
	try {
		const payload = await decryptRefreshToken(refreshToken);
		const stored = await prisma.refreshToken.findUnique({
			where: { jti: payload.jti! },
			include: {
				identity: {
					include: {
						role: true,
						staffMember: true,
					},
				},
			},
		});

		if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
			return null;
		}
		if (stored.tokenHash && stored.tokenHash !== sha256(refreshToken)) {
			return null;
		}
		if (stored.identity.disabledAt) {
			return null;
		}

		return {
			sub: stored.identity.staffMemberId,
			email: stored.identity.email,
			roleId: stored.identity.roleId,
			roleName: stored.identity.role.name,
			businessId: stored.identity.staffMember.businessId,
			typ: "access",
			jti: stored.jti,
		};
	} catch {
		return null;
	}
}
