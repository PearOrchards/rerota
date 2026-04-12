import { Suspense } from "react";
import { LoginForm } from "./components/LoginForm";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
	return (
		<main className="min-h-screen w-full flex items-center justify-center">
			<div className="w-full max-w-lg rounded-2xl bg-neutral-200 dark:bg-neutral-950 px-8 py-6 shadow-lg">
				<h1 className="text-3xl font-semibold">SIGN IN</h1>
				<p className="italic">We send a link to login, so just enter your email below.</p>
				<Suspense fallback={<Spinner />}>
					<LoginForm />
				</Suspense>
			</div>
		</main>
	);
}
