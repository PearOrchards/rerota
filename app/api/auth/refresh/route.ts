import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { decryptRefreshToken } from "@/lib/auth/jwt";
import { issueAuthTokens } from "@/lib/auth/tokens";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { sha256 } from "@/lib/auth/crypto";

const REFRESH_COOKIE_NAME = "refresh_token";

export async function POST() {
	const refreshToken = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;

	if (!refreshToken) {
		const res = NextResponse.json({ ok: false }, { status: 401 });
		clearAuthCookies(res);
		return res;
	}

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
			throw new Error("Refresh token invalid.");
		}
		if (stored.tokenHash && stored.tokenHash !== sha256(refreshToken)) {
			throw new Error("Refresh token mismatch.");
		}
		if (stored.identity.disabledAt) {
			throw new Error("Identity disabled.");
		}

		await prisma.refreshToken.update({
			where: { id: stored.id },
			data: { revokedAt: new Date() },
		});

		const { accessToken, refreshToken: newRefresh } = await issueAuthTokens(
			stored.identity,
			{ rotatedFromId: stored.id },
		);

		const response = NextResponse.json({ ok: true });
		setAuthCookies(response, accessToken, newRefresh);
		return response;
	} catch {
		const response = NextResponse.json({ ok: false }, { status: 401 });
		clearAuthCookies(response);
		return response;
	}
}

export const dynamic = "force-dynamic";
