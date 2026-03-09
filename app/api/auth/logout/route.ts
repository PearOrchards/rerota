import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
const REFRESH_COOKIE_NAME = "refresh_token";
import { decryptRefreshToken } from "@/lib/auth/jwt";
import { clearAuthCookies } from "@/lib/auth/cookies";

export async function POST() {
	const refreshToken = (await cookies()).get(REFRESH_COOKIE_NAME)?.value;
	if (refreshToken) {
		try {
			const payload = await decryptRefreshToken(refreshToken);
			await prisma.refreshToken.updateMany({
				where: { jti: payload.jti!, revokedAt: null },
				data: { revokedAt: new Date() },
			});
		} catch {
			// ignore invalid token
		}
	}

	const response = NextResponse.json({ ok: true });
	clearAuthCookies(response);
	return response;
}
