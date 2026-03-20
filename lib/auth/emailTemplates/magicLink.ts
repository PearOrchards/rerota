const EMAIL_SUBJECT = "Login to Rerota";

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;")
		.replaceAll("'", "&#39;");
}

export function buildMagicLinkEmail(link: string) {
	const safeLink = escapeHtml(link);

	return {
		subject: EMAIL_SUBJECT,
		text: "Click the link below to log in to Rerota:\n\n" + link,
		html: `
			<p>Click the link below to log in to Rerota:</p>
			<p><a href="${safeLink}" style="display:inline-block;padding:10px 20px;background-color:#000;color:#fff;text-decoration:none;border-radius:5px;">Log In</a></p>
			<p style="color:#aaa;font-size:12px;"><i>If you did not request this email, you can safely ignore it.<i/></p>
		`,
	};
}
