"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
	const searchParams = useSearchParams();
	const error = searchParams.get("error");

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (!email) return;
		setStatus("sending");
		await fetch("/api/auth/request", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});
		setStatus("sent");
	}

	return (
		<main className="min-h-screen w-full flex items-center justify-center">
			<div className="w-full max-w-lg rounded-2xl bg-neutral-950 px-8 py-6 shadow-lg">
				<h1 className="text-3xl font-semibold">SIGN IN</h1>
				<p className="italic">We send a link to login, so just enter your email below.</p>
				{error ? (
					<p className="mt-2 text-sm text-red-600">Link is either invalid or expired.</p>
				) : null}
				<form className="mt-4" onSubmit={handleSubmit}>
					<Input
						type="email"
						name="email"
						value={email}
						onChange={event => setEmail(event.target.value)}
						placeholder="you@example.com"
						className="w-full rounded-md border px-3 py-2 text-sm"
						required
					/>
					<Button
						type="submit"
						disabled={status === "sending"}
						className="mt-2 w-full bg-neutral-900 text-white disabled:opacity-60"
					>
						{status === "sent" ? "Check your email!" : "Send link"}
					</Button>
				</form>
				{ status === "sent" ? (
					<p className="mt-2 text-sm">
						If the address exists in our system, a link has been sent.
					</p>
				) : null }
			</div>
		</main>
	);
}
