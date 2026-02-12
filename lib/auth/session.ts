import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { decryptAccessToken, type SessionClaims } from "@/lib/auth/jwt";

const ACCESS_COOKIE_NAME = "access_token";

export async function getSession(): Promise<SessionClaims | null> {
	const token = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
	if (!token) {
		return null;
	}
	try {
		return await decryptAccessToken(token);
	} catch {
		return null;
	}
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
	const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
	if (!token) {
		return null;
	}
	try {
		return await decryptAccessToken(token);
	} catch {
		return null;
	}
}
