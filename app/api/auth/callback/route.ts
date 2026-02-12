import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magic-links";
import { issueAuthTokens } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return NextResponse.redirect(new URL("/login?error=invalid", url));
	}

	const identity = await consumeMagicLink(token);
	if (!identity) {
		return NextResponse.redirect(new URL("/login?error=invalid", url));
	}

	const { accessToken, refreshToken } = await issueAuthTokens(identity);
	const response = NextResponse.redirect(new URL("/", url));
	setAuthCookies(response, accessToken, refreshToken);
	return response;
}
