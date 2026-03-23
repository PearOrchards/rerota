import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Figtree } from "next/font/google";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import {
	parseSidebarViewMode,
	SIDEBAR_VIEW_MODE_COOKIE_NAME,
} from "@/lib/sidebarViewMode";
import "./globals.css";

const figtreeFont = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Rerota",
	description: "The sophisticated worker deployment platform",
};

function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemeProvider>) {
	return (
		<NextThemeProvider {...props} attribute="class" defaultTheme="system">
			{children}
		</NextThemeProvider>
	);
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const [session, cookieStore] = await Promise.all([getSession(), cookies()]);
	const sidebarStateCookie = cookieStore.get("sidebar_state")?.value;
	const sidebarViewMode = parseSidebarViewMode(
		cookieStore.get(SIDEBAR_VIEW_MODE_COOKIE_NAME)?.value,
	);
	const defaultSidebarOpen =
		sidebarStateCookie === undefined ? true : sidebarStateCookie === "true";

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${figtreeFont.className} antialiased bg-blue-50 dark:bg-zinc-900`}
			>
				<ThemeProvider>
					<SidebarProvider defaultOpen={defaultSidebarOpen}>
						<AppSidebar
							initialViewMode={sidebarViewMode}
							roleName={session?.roleName ?? null}
						/>
						{children}
						<Toaster position="top-right" />
					</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
