import { createTransport } from "nodemailer";
import { buildMagicLinkEmail } from "@/lib/auth/email-templates/magic-link";

const transporter = createTransport({
	host: process.env.SMTP_HOST,
	port: 465,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export async function sendMagicLinkEmail(email: string, link: string) {
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
		console.warn("Can't send magic link email - SMTP configuration is missing");
		console.log(`Magic link for ${email}: ${link}`);
		return;
	}

	const template = buildMagicLinkEmail(link);

	const mailOptions = {
		from: process.env.SMTP_USER,
		to: email,
		subject: template.subject,
		text: template.text,
		html: template.html,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log("Magic link email sent: " + info.messageId);
	} catch (error) {
		console.error("Error sending magic link email:", error);
	}
}
