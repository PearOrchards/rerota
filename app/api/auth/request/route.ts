import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMagicLink } from "@/lib/auth/magic-links";
import { sendMagicLinkEmail } from "@/lib/auth/email";

export async function POST(request: Request) {
	let email: string;
	try {
		const body = await request.json();
		email = String(body?.email ?? "").trim().toLowerCase();
	} catch {
		email = "";
	}

	if (!email) {
		return NextResponse.json({ ok: true });
	}

	const identity = await prisma.identity.findUnique({
		where: { email },
		select: {
			staffMemberId: true,
			email: true,
			disabledAt: true,
		},
	});

	if (!identity || identity.disabledAt) {
		return NextResponse.json({ ok: true });
	}

	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
	const userAgent = request.headers.get("user-agent");

	const { link } = await createMagicLink(identity, { ip, userAgent });
	await sendMagicLinkEmail(identity.email, link);

	return NextResponse.json({ ok: true });
}
