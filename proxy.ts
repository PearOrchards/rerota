import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { requiredRoleForPath, roleAllows } from "@/lib/auth/roles";

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === "/unauthorized" || pathname === "/login") {
		return NextResponse.next();
	}

	const session = await getSessionFromRequest(request);
	if (!session) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("next", pathname);
		return NextResponse.redirect(loginUrl);
	}

	const requiredRole = requiredRoleForPath(pathname);
	if (requiredRole && !roleAllows(session.roleName, requiredRole)) {
		return NextResponse.redirect(new URL("/unauthorized", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|.*\\.png$).*)",
	],
};
