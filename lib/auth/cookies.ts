import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;
const ACCESS_TOKEN_TTL_MINUTES = Number(process.env.AUTH_ACCESS_TTL_MINUTES ?? 15);
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.AUTH_REFRESH_TTL_DAYS ?? 30);

const baseCookieOptions = {
	httpOnly: true,
	sameSite: "lax" as const,
	secure: process.env.NODE_ENV === "production",
	path: "/",
	domain: AUTH_COOKIE_DOMAIN,
};

const accessCookieOptions = {
	...baseCookieOptions,
	maxAge: ACCESS_TOKEN_TTL_MINUTES * 60,
};

const refreshCookieOptions = {
	...baseCookieOptions,
	maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
};

export function setAuthCookies(
	response: NextResponse,
	accessToken: string,
	refreshToken: string,
) {
	response.cookies.set(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
	response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
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
