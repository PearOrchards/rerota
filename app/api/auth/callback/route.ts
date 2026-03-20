import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth/magicLinks";
import { issueAuthTokens } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return NextResponse.redirect(new URL("/login?error=invalid", APP_URL));
	}

	const identity = await consumeMagicLink(token);
	if (!identity) {
		return NextResponse.redirect(new URL("/login?error=invalid", APP_URL));
	}

	const { accessToken, refreshToken } = await issueAuthTokens(identity);
	const response = NextResponse.redirect(new URL("/", APP_URL));
	setAuthCookies(response, accessToken, refreshToken);
	return response;
}
