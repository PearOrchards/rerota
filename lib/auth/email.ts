export async function sendMagicLinkEmail(email: string, link: string) {
	// Console-only provider for now.
	console.log(`[MagicLink] ${email} -> ${link}`);
}
