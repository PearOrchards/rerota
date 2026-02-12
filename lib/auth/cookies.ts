import { NextResponse } from "next/server";
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;

const baseCookieOptions = {
	httpOnly: true,
	sameSite: "lax" as const,
	secure: process.env.NODE_ENV === "production",
	path: "/",
	domain: AUTH_COOKIE_DOMAIN,
};

export function setAuthCookies(
	response: NextResponse,
	accessToken: string,
	refreshToken: string,
) {
	response.cookies.set(ACCESS_COOKIE_NAME, accessToken, baseCookieOptions);
	response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, baseCookieOptions);
}

export function clearAuthCookies(response: NextResponse) {
	response.cookies.set(ACCESS_COOKIE_NAME, "", {
		...baseCookieOptions,
		maxAge: 0,
	});
	response.cookies.set(REFRESH_COOKIE_NAME, "", {
		...baseCookieOptions,
		maxAge: 0,
	});
}
